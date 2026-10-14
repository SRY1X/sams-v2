export type Role = "student" | "faculty" | "admin";
export type MembershipStatus = "active" | "suspended";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      institutions: Table<{
        id: string;
        name: string;
        slug: string;
        timezone: string;
        created_at: string;
      }>;
      institution_settings: Table<{
        institution_id: string;
        settings: Json;
        updated_at: string;
      }>;
      profiles: Table<{
        id: string;
        display_name: string;
        created_at: string;
        updated_at: string;
      }>;
      institution_memberships: Table<{
        id: string;
        institution_id: string;
        user_id: string;
        role: Role;
        status: MembershipStatus;
        created_at: string;
      }>;
      departments: Table<{
        id: string;
        institution_id: string;
        name: string;
        code: string | null;
        created_at: string;
      }>;
      academic_terms: Table<{
        id: string;
        institution_id: string;
        name: string;
        starts_on: string;
        ends_on: string;
        created_at: string;
      }>;
      courses: Table<{
        id: string;
        institution_id: string;
        department_id: string | null;
        code: string;
        title: string;
        created_at: string;
      }>;
      course_sections: Table<{
        id: string;
        institution_id: string;
        course_id: string;
        term_id: string;
        section_code: string;
        created_at: string;
      }>;
      section_faculty: Table<{
        id: string;
        institution_id: string;
        section_id: string;
        faculty_user_id: string;
        member_role: "faculty";
        created_at: string;
      }>;
      enrollments: Table<{
        id: string;
        institution_id: string;
        section_id: string;
        student_user_id: string;
        member_role: "student";
        status: string;
        created_at: string;
      }>;
      attendance_sessions: Table<{
        id: string;
        institution_id: string;
        section_id: string;
        created_by: string;
        status: string;
        starts_at: string;
        expires_at: string;
        closed_at: string | null;
        created_at: string;
      }>;
      attendance_records: Table<{
        id: string;
        institution_id: string;
        session_id: string;
        student_user_id: string;
        recorded_at: string;
        status: string;
      }>;
      audit_events: Table<{
        id: string;
        institution_id: string;
        actor_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        details: Json;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_attendance_session: {
        Args: { p_section_id: string };
        Returns: string;
      };
      close_attendance_session: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
      record_attendance: { Args: { p_session_id: string }; Returns: string };
      can_manage_attendance_session: {
        Args: { p_session_id: string };
        Returns: boolean;
      };
      get_attendance_qr_context: {
        Args: { p_session_id: string };
        Returns: {
          expires_at: string;
          qr_rotation_seconds: number;
          qr_token_ttl_seconds: number;
        }[];
      };
      get_attendance_session_snapshot: {
        Args: { p_session_id: string };
        Returns: { timezone: string; records: Json }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
