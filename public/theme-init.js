(function () {
  const theme = localStorage.getItem("kore-theme") || "beige";
  document.documentElement.setAttribute("data-theme", theme);
})();
