import http from '@/lib/http';
import type { JobOpening, Application } from '../types/recruitment';

export const recruitmentApi = {
    // === JOBS ===
    getJobs: async () => {
        const { data } = await http.get<{ data: JobOpening[] }>('/ats/jobs');
        return data.data;
    },
    getJob: async (id: string) => {
        const { data } = await http.get<{ data: JobOpening }>(`/ats/jobs/${id}`);
        return data.data;
    },
    createJob: async (payload: Partial<JobOpening>) => {
        const { data } = await http.post<{ data: JobOpening }>('/ats/jobs', payload);
        return data.data;
    },
    updateJob: async (id: string, payload: Partial<JobOpening>) => {
        const { data } = await http.put<{ data: JobOpening }>(`/ats/jobs/${id}`, payload);
        return data.data;
    },
    deleteJob: async (id: string) => {
        await http.delete(`/ats/jobs/${id}`);
    },

    // === APPLICATIONS ===
    getApplications: async () => {
        const { data } = await http.get<{ data: Application[] }>('/ats/applications');
        return data.data;
    },
    getApplication: async (id: string) => {
        const { data } = await http.get<{ data: Application }>(`/ats/applications/${id}`);
        return data.data;
    },
    changeStatus: async (id: string, status: string, notes?: string) => {
        const { data } = await http.post<{ data: Application }>(`/ats/applications/${id}/status`, { status, notes });
        return data.data;
    },
    scheduleInterview: async (id: string, date: string, notes?: string, notifyWhatsapp = false) => {
        const { data } = await http.post<{ data: Application }>(`/ats/applications/${id}/interview`, { 
            interview_scheduled_at: date, 
            notes, 
            notify_whatsapp: notifyWhatsapp 
        });
        return data.data;
    },
    recordInterviewResult: async (id: string, result: string, notes?: string) => {
        const { data } = await http.post<{ data: Application }>(`/ats/applications/${id}/interview/result`, { result, notes });
        return data.data;
    },
    hireTrial: async (id: string, trial_period_months: number, salary: number, modules: string[]) => {
        const { data } = await http.post(`/ats/applications/${id}/hire`, { 
            trial_period_months, 
            salary, 
            modules 
        });
        return data;
    },
    reject: async (id: string, reason: string, notifyWhatsapp = false) => {
        const { data } = await http.post(`/ats/applications/${id}/reject`, { 
            reason, 
            notify_whatsapp: notifyWhatsapp 
        });
        return data;
    },
    toggleManualReview: async (id: string, manualReviewRequired: boolean, reason?: string) => {
        const { data } = await http.post<{ data: Application }>(`/ats/applications/${id}/manual-review`, {
            manual_review_required: manualReviewRequired,
            manual_review_reason: reason,
        });
        return data.data;
    }
};
