import http from '@/lib/http';
import type { JobOpening, JobOpeningTemplate, Application, ApplicationDocument, ApplicationOffer, Interview, OnboardingDocument, PipelineAnalytics, RehireCheck, EmailTemplate, EmailTemplateType } from '../types/recruitment';

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

    // === JOB TEMPLATES ===
    getJobTemplates: async () => {
        const { data } = await http.get<{ data: JobOpeningTemplate[] }>('/ats/job-templates');
        return data.data;
    },
    getJobTemplate: async (id: string) => {
        const { data } = await http.get<{ data: JobOpeningTemplate }>(`/ats/job-templates/${id}`);
        return data.data;
    },
    createJobTemplate: async (payload: Partial<JobOpeningTemplate>) => {
        const { data } = await http.post<{ data: JobOpeningTemplate }>('/ats/job-templates', payload);
        return data.data;
    },
    updateJobTemplate: async (id: string, payload: Partial<JobOpeningTemplate>) => {
        const { data } = await http.put<{ data: JobOpeningTemplate }>(`/ats/job-templates/${id}`, payload);
        return data.data;
    },
    deleteJobTemplate: async (id: string) => {
        await http.delete(`/ats/job-templates/${id}`);
    },
    duplicateJobTemplate: async (id: string) => {
        const { data } = await http.post<{ data: JobOpeningTemplate }>(`/ats/job-templates/${id}/duplicate`);
        return data.data;
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
    scheduleInterview: async (id: string, payload: { interview_scheduled_at: string; notes?: string; notify_whatsapp?: boolean; method?: 'in-person' | 'video' | 'phone'; location?: string; meeting_url?: string }) => {
        const { data } = await http.post<{ data: Application }>(`/ats/applications/${id}/interview`, payload);
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
    },

    // === REHIRE ===
    checkRehire: async (id: string) => {
        const { data } = await http.get<{ data: RehireCheck }>(`/ats/applications/${id}/rehire-check`);
        return data.data;
    },
    rehire: async (id: string, payload: { salary: number; modules?: string[]; position_id?: string }) => {
        const { data } = await http.post(`/ats/applications/${id}/rehire`, payload);
        return data;
    },

    // === INTERVIEWS ===
    getInterviews: async (applicationId: string) => {
        const { data } = await http.get<{ data: Interview[] }>(`/ats/applications/${applicationId}/interviews`);
        return data.data;
    },
    createInterview: async (applicationId: string, payload: Partial<Interview>) => {
        const { data } = await http.post<{ data: Interview }>(`/ats/applications/${applicationId}/interviews`, payload);
        return data.data;
    },
    updateInterview: async (id: string, payload: Partial<Interview>) => {
        const { data } = await http.put<{ data: Interview }>(`/ats/interviews/${id}`, payload);
        return data.data;
    },
    deleteInterview: async (id: string) => {
        await http.delete(`/ats/interviews/${id}`);
    },

    // === OFFERS ===
    sendOffer: async (id: string, payload: { salary: number; trial_months: number; position_id?: string; notes?: string }) => {
        const { data } = await http.post<{ data: ApplicationOffer }>(`/ats/applications/${id}/offer`, payload);
        return data.data;
    },
    getOffer: async (id: string) => {
        const { data } = await http.get<{ data: ApplicationOffer }>(`/ats/applications/${id}/offer`);
        return data.data;
    },
    resendOffer: async (id: string) => {
        const { data } = await http.post<{ data: ApplicationOffer }>(`/ats/applications/${id}/offer/resend`);
        return data.data;
    },

    // === ONBOARDING DOCUMENTS ===
    getOnboardingDocuments: async (id: string) => {
        const { data } = await http.get<{ data: OnboardingDocument[] }>(`/ats/applications/${id}/onboarding-documents`);
        return data.data;
    },
    verifyOnboardingDocument: async (id: string, type: string) => {
        const { data } = await http.post<{ data: ApplicationDocument }>(`/ats/applications/${id}/onboarding-documents/${type}/verify`);
        return data.data;
    },
    unverifyOnboardingDocument: async (id: string, type: string) => {
        const { data } = await http.post<{ data: ApplicationDocument }>(`/ats/applications/${id}/onboarding-documents/${type}/unverify`);
        return data.data;
    },

    // === ANALYTICS ===
    getPipelineAnalytics: async (params?: { date_from?: string; date_to?: string; job_opening_id?: string }) => {
        const { data } = await http.get<{ data: PipelineAnalytics }>('/ats/analytics/pipeline', { params });
        return data.data;
    },

    // === EMAIL TEMPLATES ===
    getEmailTemplates: async () => {
        const { data } = await http.get<{ data: EmailTemplate[] }>('/ats/email-templates');
        return data.data;
    },
    getEmailTemplateTypes: async () => {
        const { data } = await http.get<{ data: EmailTemplateType[] }>('/ats/email-templates/types');
        return data.data;
    },
    createEmailTemplate: async (payload: Partial<EmailTemplate>) => {
        const { data } = await http.post<{ data: EmailTemplate }>('/ats/email-templates', payload);
        return data.data;
    },
    updateEmailTemplate: async (id: string, payload: Partial<EmailTemplate>) => {
        const { data } = await http.put<{ data: EmailTemplate }>(`/ats/email-templates/${id}`, payload);
        return data.data;
    },
    deleteEmailTemplate: async (id: string) => {
        await http.delete(`/ats/email-templates/${id}`);
    },
};
