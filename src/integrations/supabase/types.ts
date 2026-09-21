export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_table: string | null
          id: string
          metadata: Json
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          metadata?: Json
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          metadata?: Json
          summary?: string | null
        }
        Relationships: []
      }
      blog_authors: {
        Row: {
          bio: string | null
          created_at: string
          doctor_id: string | null
          id: string
          name: string
          photo_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          name: string
          photo_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_authors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_departments: {
        Row: {
          department_id: string
          post_id: string
        }
        Insert: {
          department_id: string
          post_id: string
        }
        Update: {
          department_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_departments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_doctors: {
        Row: {
          doctor_id: string
          post_id: string
        }
        Insert: {
          doctor_id: string
          post_id: string
        }
        Update: {
          doctor_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_doctors_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_facilities: {
        Row: {
          facility_id: string
          post_id: string
        }
        Insert: {
          facility_id: string
          post_id: string
        }
        Update: {
          facility_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_facilities_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_hospital_services: {
        Row: {
          hospital_service_id: string
          post_id: string
        }
        Insert: {
          hospital_service_id: string
          post_id: string
        }
        Update: {
          hospital_service_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_hospital_services_hospital_service_id_fkey"
            columns: ["hospital_service_id"]
            isOneToOne: false
            referencedRelation: "hospital_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_hospital_services_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_professional_services: {
        Row: {
          post_id: string
          professional_service_id: string
        }
        Insert: {
          post_id: string
          professional_service_id: string
        }
        Update: {
          post_id?: string
          professional_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_professional_services_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_professional_services_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string | null
          category_id: string | null
          clinical_review_notes: string | null
          clinical_review_status: Database["public"]["Enums"]["clinical_review_status"]
          clinical_reviewed_at: string | null
          clinical_reviewer_id: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          clinical_review_notes?: string | null
          clinical_review_status?: Database["public"]["Enums"]["clinical_review_status"]
          clinical_reviewed_at?: string | null
          clinical_reviewer_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          category_id?: string | null
          clinical_review_notes?: string | null
          clinical_review_status?: Database["public"]["Enums"]["clinical_review_status"]
          clinical_reviewed_at?: string | null
          clinical_reviewer_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_clinical_reviewer_id_fkey"
            columns: ["clinical_reviewer_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctor_achievements: {
        Row: {
          achievement_type: string
          created_at: string
          description: string | null
          display_order: number
          doctor_id: string
          enabled: boolean
          id: string
          organization: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          achievement_type: string
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id: string
          enabled?: boolean
          id?: string
          organization?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          achievement_type?: string
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          id?: string
          organization?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_achievements_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_education: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          doctor_id: string
          enabled: boolean
          id: string
          institution: string | null
          qualification: string
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id: string
          enabled?: boolean
          id?: string
          institution?: string | null
          qualification: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          id?: string
          institution?: string | null
          qualification?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_education_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_experience: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          doctor_id: string
          enabled: boolean
          end_year: number | null
          id: string
          is_present: boolean
          organization: string
          position: string | null
          start_year: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id: string
          enabled?: boolean
          end_year?: number | null
          id?: string
          is_present?: boolean
          organization: string
          position?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          end_year?: number | null
          id?: string
          is_present?: boolean
          organization?: string
          position?: string | null
          start_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_experience_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_faqs: {
        Row: {
          display_order: number
          doctor_id: string
          enabled: boolean
          faq_id: string
        }
        Insert: {
          display_order?: number
          doctor_id: string
          enabled?: boolean
          faq_id: string
        }
        Update: {
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          faq_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_faqs_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_faqs_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_locations: {
        Row: {
          consultation_availability: string | null
          display_order: number
          doctor_id: string
          enabled: boolean
          location_id: string
        }
        Insert: {
          consultation_availability?: string | null
          display_order?: number
          doctor_id: string
          enabled?: boolean
          location_id: string
        }
        Update: {
          consultation_availability?: string | null
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_locations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_profile_change_requests: {
        Row: {
          changes: Json
          created_at: string
          doctor_id: string
          id: string
          note: string | null
          requested_by: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          doctor_id: string
          id?: string
          note?: string | null
          requested_by?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          changes?: Json
          created_at?: string
          doctor_id?: string
          id?: string
          note?: string | null
          requested_by?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_profile_change_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_specializations: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          doctor_id: string
          enabled: boolean
          icon: string | null
          id: string
          professional_service_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id: string
          enabled?: boolean
          icon?: string | null
          id?: string
          professional_service_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          icon?: string | null
          id?: string
          professional_service_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_specializations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_specializations_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_statistics: {
        Row: {
          created_at: string
          display_order: number
          doctor_id: string
          enabled: boolean
          icon: string | null
          id: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          doctor_id: string
          enabled?: boolean
          icon?: string | null
          id?: string
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          icon?: string | null
          id?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_statistics_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          canonical_url: string | null
          created_at: string
          department_id: string | null
          designation: string | null
          display_order: number
          experience_years: number | null
          expertise: string[]
          hero_image_alt: string | null
          hero_image_url: string | null
          id: string
          languages: string[]
          location: string | null
          name: string
          og_image_url: string | null
          phone_number: string | null
          photo_url: string | null
          profile_image_alt: string | null
          published: boolean
          qualifications: string[]
          quote: string | null
          quote_attribution: string | null
          section_visibility: Json
          seo_description: string | null
          seo_title: string | null
          short_introduction: string | null
          slug: string
          social_links: Json
          specialty: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          whatsapp_number: string | null
        }
        Insert: {
          bio?: string | null
          canonical_url?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          display_order?: number
          experience_years?: number | null
          expertise?: string[]
          hero_image_alt?: string | null
          hero_image_url?: string | null
          id?: string
          languages?: string[]
          location?: string | null
          name: string
          og_image_url?: string | null
          phone_number?: string | null
          photo_url?: string | null
          profile_image_alt?: string | null
          published?: boolean
          qualifications?: string[]
          quote?: string | null
          quote_attribution?: string | null
          section_visibility?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_introduction?: string | null
          slug: string
          social_links?: Json
          specialty?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp_number?: string | null
        }
        Update: {
          bio?: string | null
          canonical_url?: string | null
          created_at?: string
          department_id?: string | null
          designation?: string | null
          display_order?: number
          experience_years?: number | null
          expertise?: string[]
          hero_image_alt?: string | null
          hero_image_url?: string | null
          id?: string
          languages?: string[]
          location?: string | null
          name?: string
          og_image_url?: string | null
          phone_number?: string | null
          photo_url?: string | null
          profile_image_alt?: string | null
          published?: boolean
          qualifications?: string[]
          quote?: string | null
          quote_attribution?: string | null
          section_visibility?: Json
          seo_description?: string | null
          seo_title?: string | null
          short_introduction?: string | null
          slug?: string
          social_links?: Json
          specialty?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          contact_number: string
          created_at: string
          department_id: string | null
          doctor_id: string | null
          family_member_name: string | null
          hospital_service_id: string | null
          id: string
          message: string | null
          notes: string | null
          patient_name: string
          preferred_at: string | null
          professional_service_id: string | null
          source: string
          status: Database["public"]["Enums"]["enquiry_status"]
          updated_at: string
        }
        Insert: {
          contact_number: string
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          family_member_name?: string | null
          hospital_service_id?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          patient_name: string
          preferred_at?: string | null
          professional_service_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
        }
        Update: {
          contact_number?: string
          created_at?: string
          department_id?: string | null
          doctor_id?: string | null
          family_member_name?: string | null
          hospital_service_id?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          patient_name?: string
          preferred_at?: string | null
          professional_service_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_hospital_service_id_fkey"
            columns: ["hospital_service_id"]
            isOneToOne: false
            referencedRelation: "hospital_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiry_forwardings: {
        Row: {
          channel: string
          created_at: string
          enquiry_id: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["forward_status"]
          target_label: string | null
          target_number: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          enquiry_id: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["forward_status"]
          target_label?: string | null
          target_number?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          enquiry_id?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["forward_status"]
          target_label?: string | null
          target_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiry_forwardings_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          images: string[]
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[]
          name: string
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          images?: string[]
          name?: string
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      facility_departments: {
        Row: {
          department_id: string
          facility_id: string
        }
        Insert: {
          department_id: string
          facility_id: string
        }
        Update: {
          department_id?: string
          facility_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_departments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_doctors: {
        Row: {
          doctor_id: string
          facility_id: string
        }
        Insert: {
          doctor_id: string
          facility_id: string
        }
        Update: {
          doctor_id?: string
          facility_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_doctors_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_hospital_services: {
        Row: {
          facility_id: string
          hospital_service_id: string
        }
        Insert: {
          facility_id: string
          hospital_service_id: string
        }
        Update: {
          facility_id?: string
          hospital_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_hospital_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_hospital_services_hospital_service_id_fkey"
            columns: ["hospital_service_id"]
            isOneToOne: false
            referencedRelation: "hospital_services"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_professional_services: {
        Row: {
          facility_id: string
          professional_service_id: string
        }
        Insert: {
          facility_id: string
          professional_service_id: string
        }
        Update: {
          facility_id?: string
          professional_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_professional_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_professional_services_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category_id: string | null
          created_at: string
          display_order: number
          id: string
          published: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          published?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          published?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address_line: string | null
          city: string | null
          created_at: string
          display_order: number
          email: string | null
          id: string
          map_url: string | null
          name: string
          opening_hours: string | null
          phone: string | null
          postal_code: string | null
          published: boolean
          slug: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          map_url?: string | null
          name: string
          opening_hours?: string | null
          phone?: string | null
          postal_code?: string | null
          published?: boolean
          slug: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          city?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          map_url?: string | null
          name?: string
          opening_hours?: string | null
          phone?: string | null
          postal_code?: string | null
          published?: boolean
          slug?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_departments: {
        Row: {
          department_id: string
          media_id: string
        }
        Insert: {
          department_id: string
          media_id: string
        }
        Update: {
          department_id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_departments_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media_doctors: {
        Row: {
          display_order: number
          doctor_id: string
          enabled: boolean
          media_id: string
          show_on_profile: boolean
        }
        Insert: {
          display_order?: number
          doctor_id: string
          enabled?: boolean
          media_id: string
          show_on_profile?: boolean
        }
        Update: {
          display_order?: number
          doctor_id?: string
          enabled?: boolean
          media_id?: string
          show_on_profile?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "media_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_doctors_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media_hospital_services: {
        Row: {
          hospital_service_id: string
          media_id: string
        }
        Insert: {
          hospital_service_id: string
          media_id: string
        }
        Update: {
          hospital_service_id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_hospital_services_hospital_service_id_fkey"
            columns: ["hospital_service_id"]
            isOneToOne: false
            referencedRelation: "hospital_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_hospital_services_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          published: boolean
          show_on_home: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          published?: boolean
          show_on_home?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          published?: boolean
          show_on_home?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      media_professional_services: {
        Row: {
          media_id: string
          professional_service_id: string
        }
        Insert: {
          media_id: string
          professional_service_id: string
        }
        Update: {
          media_id?: string
          professional_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_professional_services_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_professional_services_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          created_at: string
          display_order: number
          href: string
          id: string
          label: string
          menu: string
          parent_id: string | null
          published: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          href: string
          id?: string
          label: string
          menu?: string
          parent_id?: string | null
          published?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          href?: string
          id?: string
          label?: string
          menu?: string
          parent_id?: string | null
          published?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_service_departments: {
        Row: {
          department_id: string
          professional_service_id: string
        }
        Insert: {
          department_id: string
          professional_service_id: string
        }
        Update: {
          department_id?: string
          professional_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_departments_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_service_doctors: {
        Row: {
          doctor_id: string
          professional_service_id: string
        }
        Insert: {
          doctor_id: string
          professional_service_id: string
        }
        Update: {
          doctor_id?: string
          professional_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_service_doctors_professional_service_id_fkey"
            columns: ["professional_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          published: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          published?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          published?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          doctor_id: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          doctor_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          doctor_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_name: string
          content: string
          created_at: string
          display_order: number
          doctor_id: string | null
          id: string
          rating: number | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewed_at: string | null
          show_publicly: boolean
          source: string | null
          updated_at: string
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          display_order?: number
          doctor_id?: string | null
          id?: string
          rating?: number | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewed_at?: string | null
          show_publicly?: boolean
          source?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          display_order?: number
          doctor_id?: string | null
          id?: string
          rating?: number | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewed_at?: string | null
          show_publicly?: boolean
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_pages: {
        Row: {
          body: string | null
          created_at: string
          display_order: number
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          display_order?: number
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          display_order?: number
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_content: { Args: never; Returns: boolean }
      can_manage_enquiries: { Args: never; Returns: boolean }
      can_publish: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "editor"
        | "doctor"
        | "super_admin"
        | "front_desk"
        | "writer"
      clinical_review_status:
        | "not_required"
        | "pending"
        | "approved"
        | "changes_requested"
      enquiry_status:
        | "submitted"
        | "pending_forwarding"
        | "forwarded"
        | "contacted"
        | "closed"
        | "cancelled"
      forward_status: "prepared" | "sent" | "failed"
      media_type: "youtube" | "reel" | "podcast"
      post_status: "draft" | "in_review" | "ready_to_publish" | "published"
      request_status: "pending" | "approved" | "rejected"
      review_type: "hospital" | "doctor"
      verification_status: "unverified" | "pending" | "verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "editor",
        "doctor",
        "super_admin",
        "front_desk",
        "writer",
      ],
      clinical_review_status: [
        "not_required",
        "pending",
        "approved",
        "changes_requested",
      ],
      enquiry_status: [
        "submitted",
        "pending_forwarding",
        "forwarded",
        "contacted",
        "closed",
        "cancelled",
      ],
      forward_status: ["prepared", "sent", "failed"],
      media_type: ["youtube", "reel", "podcast"],
      post_status: ["draft", "in_review", "ready_to_publish", "published"],
      request_status: ["pending", "approved", "rejected"],
      review_type: ["hospital", "doctor"],
      verification_status: ["unverified", "pending", "verified"],
    },
  },
} as const
