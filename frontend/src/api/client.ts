import {
  LoginRequest,
  LoginResponse,
  User,
  IntakeRequest,
  FollowupRequest,
  IntakeWorkflowResponse,
  TriageNoteDetail,
  ClinicalRule,
  EscalateRequest
} from '../types/api';

const API_BASE_URL = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('clintrace_token');
  }

  public setToken(token: string): void {
    localStorage.setItem('clintrace_token', token);
  }

  public clearToken(): void {
    localStorage.removeItem('clintrace_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (e) {
        // use default HTTP status message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  public async getHealth(): Promise<{ status: string; database: string }> {
    return this.request('/health');
  }

  public async getRules(): Promise<ClinicalRule[]> {
    return this.request('/rules');
  }

  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  public async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  public async submitIntake(payload: IntakeRequest): Promise<IntakeWorkflowResponse> {
    return this.request<IntakeWorkflowResponse>('/intake', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async submitFollowup(sessionId: number, payload: FollowupRequest): Promise<IntakeWorkflowResponse> {
    return this.request<IntakeWorkflowResponse>(`/intake/${sessionId}/followup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getTriageNotes(filters?: { urgency?: string; status?: string; department?: string }): Promise<TriageNoteDetail[]> {
    const params = new URLSearchParams();
    if (filters?.urgency) params.append('urgency', filters.urgency);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<TriageNoteDetail[]>(`/triage-notes${queryStr}`);
  }

  public async getTriageNoteDetail(id: number): Promise<TriageNoteDetail> {
    return this.request<TriageNoteDetail>(`/triage-notes/${id}`);
  }

  public async escalateTriageNote(id: number, payload: EscalateRequest): Promise<TriageNoteDetail> {
    return this.request<TriageNoteDetail>(`/triage-notes/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient();
