export type JobOpeningStatus = 'draft' | 'open' | 'closed';

export interface ScreeningQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export interface JobOpening {
    id: string;
    empresa_id: string;
    title: string;
    description?: string;
    requirements?: string[];
    salary_range?: string;
    schedule?: string;
    location?: string;
    job_type?: string;
    department?: string;
    vacancies_count?: number;
    benefits?: string[];
    tags?: string[];
    is_featured?: boolean;
    published_at?: string;
    slug?: string;
    image_url?: string;
    induction_video_url?: string;
    about_us?: string;
    objective?: string;
    responsibilities?: string[];
    education_requirements?: string[];
    experience_requirements?: string[];
    knowledge_requirements?: string[];
    competencies?: string[];
    performance_indicators?: string[];
    offer_details?: string[];
    closing_statement?: string;
    screening_questions?: ScreeningQuestion[];
    screening_pass_score?: number;
    scorecard_template?: ScorecardCriterion[];
    status: JobOpeningStatus;
    views_count?: number;
    created_at: string;
    updated_at: string;
}

export interface JobOpeningTemplate {
    id: string;
    empresa_id: string;
    title: string;
    description?: string;
    requirements?: string[];
    salary_range?: string;
    schedule?: string;
    image_url?: string;
    induction_video_url?: string;
    about_us?: string;
    objective?: string;
    responsibilities?: string[];
    education_requirements?: string[];
    experience_requirements?: string[];
    knowledge_requirements?: string[];
    competencies?: string[];
    performance_indicators?: string[];
    offer_details?: string[];
    closing_statement?: string;
    screening_questions?: ScreeningQuestion[];
    screening_pass_score?: number;
    status: JobOpeningStatus;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type ApplicationStatus =
    | 'new'
    | 'screening'
    | 'interview-requested'
    | 'interviewing'
    | 'offer-sent'
    | 'hired'
    | 'rejected';

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

export interface ApplicationOffer {
    id: string;
    application_id: string;
    position_id?: string;
    salary: number;
    trial_months: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    sent_at?: string;
    accepted_at?: string;
    rejected_at?: string;
    notes?: string;
    created_by?: string;
    position?: {
        id: string;
        name: string;
    };
    creator?: {
        id: string;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface OnboardingDocument {
    type: string;
    label: string;
    uploaded: boolean;
    verified: boolean;
    url?: string;
    uploaded_at?: string;
}

export interface PipelineAnalytics {
    totals: Record<ApplicationStatus, number>;
    funnel: { stage: string; count: number }[];
    average_times: Record<string, number | null>;
    rejection_reasons: { notes: string; count: number }[];
    open_jobs: (JobOpening & {
        total_applications: number;
        interviewing_count: number;
        offer_sent_count: number;
        hired_count: number;
    })[];
    upcoming_interviews: {
        id: string;
        candidate_name?: string;
        job_title?: string;
        scheduled_at: string;
        method?: InterviewMethod;
        location?: string;
        meeting_url?: string;
    }[];
}

export interface Application {
    id: string;
    empresa_id: string;
    job_opening_id: string;
    user_id: string;
    status: ApplicationStatus;
    contact_info?: {
        full_name?: string;
        email?: string;
        phone?: string;
        address?: string;
        rfc?: string;
        curp?: string;
        nss?: string;
        [key: string]: unknown;
    };
    education?: Record<string, unknown>;
    experience?: Record<string, unknown>;
    has_induction_video_watched: boolean;
    induction_video_watched_at?: string;
    screening_test_results?: {
        score?: number;
        answers?: unknown[];
        submitted_at?: string;
        [key: string]: unknown;
    };
    interview_scheduled_at?: string;
    interview_notes?: string;
    interview_result?: string;
    manual_review_required?: boolean;
    manual_review_reason?: string;
    is_rehire?: boolean;
    blacklist_alert?: boolean;
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
    interviews?: Interview[];
    offer?: ApplicationOffer;
}

export interface ScorecardCriterion {
    name: string;
    score: number;
    notes?: string;
}

export type InterviewResult = 'pending' | 'passed' | 'failed';
export type InterviewMethod = 'in-person' | 'video' | 'phone';

export interface Interview {
    id: string;
    application_id: string;
    interviewer_id?: string;
    interviewer?: {
        id: string;
        name: string;
    };
    scheduled_at: string;
    method: InterviewMethod;
    location?: string;
    meeting_url?: string;
    notes?: string;
    scorecard?: ScorecardCriterion[];
    recommendation?: string;
    result: InterviewResult;
    created_by?: string;
    creator?: {
        id: string;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

export interface RehireCheck {
    is_rehire: boolean;
    previous_empleado_id?: string;
    previous_full_name?: string;
    previous_hired_at?: string;
}

export type EmailTemplateType =
    | 'application_received'
    | 'interview_scheduled'
    | 'interview_reminder'
    | 'offer_sent'
    | 'hired'
    | 'rejected';

export interface EmailTemplate {
    id: string;
    empresa_id: string;
    type: EmailTemplateType;
    subject: string;
    body: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
