// src/features/auth/__tests__/LoginPage.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../LoginPage";
import { useAuthStore } from "../authStore";

// Mock the auth API
vi.mock("../api", () => ({
  login: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: "/login", search: "", hash: "", key: "default" }),
  };
});

import { login as apiLogin } from "../api";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it("renders the login form with email and password fields", () => {
    renderLogin();

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
  });

  it("submit button is disabled when fields are empty", () => {
    renderLogin();

    const submitBtn = screen.getByRole("button", { name: /ingresar/i });
    expect(submitBtn).toBeDisabled();
  });

  it("submit button is enabled when both fields have values", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), "test@kore.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), "password123");

    const submitBtn = screen.getByRole("button", { name: /ingresar/i });
    expect(submitBtn).toBeEnabled();
  });

  it("shows error message on failed login", async () => {
    const user = userEvent.setup();
    const mockLogin = apiLogin as ReturnType<typeof vi.fn>;
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: "Credenciales incorrectas" } },
    });

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), "bad@kore.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), "wrongpass");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });
  });

  it("navigates to manager dashboard on successful admin login", async () => {
    const user = userEvent.setup();
    const mockLogin = apiLogin as ReturnType<typeof vi.fn>;
    mockLogin.mockResolvedValueOnce({
      token: "valid-token",
      user: {
        id: "u1",
        name: "Admin",
        email: "admin@kore.com",
        role: "admin",
        empresa_id: "e1",
      },
    });

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), "admin@kore.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), "Admin123!");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/app/manager/dashboard", { replace: true });
    });
  });

  it("navigates to employee dashboard on successful employee login", async () => {
    const user = userEvent.setup();
    const mockLogin = apiLogin as ReturnType<typeof vi.fn>;
    mockLogin.mockResolvedValueOnce({
      token: "emp-token",
      user: {
        id: "u2",
        name: "Empleado",
        email: "emp@kore.com",
        role: "empleado",
        empresa_id: "e1",
      },
    });

    renderLogin();

    await user.type(screen.getByLabelText(/correo electrónico/i), "emp@kore.com");
    await user.type(screen.getByLabelText(/contraseña/i, { selector: 'input' }), "Emp12345!");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/app/employee/dashboard", { replace: true });
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = screen.getByLabelText(/contraseña/i, { selector: 'input' });
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /mostrar/i });
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("shows remember me checkbox checked by default", () => {
    renderLogin();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });
});
