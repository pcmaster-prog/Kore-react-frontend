export interface JobOpening {
    id: string;
    empresa_id: string;
    title: string;
    description?: string;
    requirements?: string[];
    salary_range?: string;
    schedule?: string;
    image_url?: string;
    status: 'draft' | 'open' | 'closed';
    created_at: string;
    updated_at: string;
}

export interface ApplicationDocument {
    id: string;
    application_id: string;
    document_type: string;
    file_path: string;
    original_name?: string;
    url?: string;
    created_at: string;
}

export interface ApplicationStatusLog {
    id: string;
    application_id: string;
    from_status?: string;
    to_status: string;
    notes?: string;
    created_at: string;
    changed_by?: {
        id: string;
        name: string;
    };
}

export interface Application {
    id: string;
    empresa_id: string;
    job_opening_id: string;
    user_id: string;
    status: string;
    contact_info?: Record<string, any>;
    education?: Record<string, any>;
    experience?: Record<string, any>;
    has_induction_video_watched: boolean;
    induction_video_watched_at?: string;
    screening_test_results?: Record<string, any>;
    interview_scheduled_at?: string;
    interview_notes?: string;
    interview_result?: string;
    created_at: string;
    updated_at: string;
    
    // Relaciones
    jobOpening?: JobOpening;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    documents?: ApplicationDocument[];
    statusLogs?: ApplicationStatusLog[];
}
