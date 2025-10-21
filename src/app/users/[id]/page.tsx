'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

interface User {
  id: number;
  full_name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

interface PersonalInfo {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  website_url: string | null;
}

interface Education {
  id: number;
  institute_name: string;
  degree: string;
  start_year: string;
  end_year: string;
  grade: string;
}

interface Experience {
  id: number;
  job_title: string;
  company_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Skill {
  id: number;
  skill_name: string;
}

interface Language {
  id: number;
  language_name: string;
}

interface Certification {
  id: number;
  title: string;
  year: string;
}

interface Project {
  id: number;
  title: string;
  description: string | null;
  technologies: string | null;
  start_date: string | null;
  end_date: string | null;
  project_url: string | null;
}

interface Resume {
  id: number;
  title: string;
  template_name: string;
  professional_summary: string | null;
  target_role: string | null;
  created_at: string;
  updated_at: string;
  personal_info: PersonalInfo | null;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  projects: Project[];
}

interface CoverLetter {
  id: number;
  resume_id: number;
  job_title: string | null;
  company_name: string | null;
  tone: string;
  letter_text: string | null;
  created_at: string;
  resume_title: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resumes' | 'cover-letters'>('resumes');
  const [expandedResumeId, setExpandedResumeId] = useState<number | null>(null);
  const [expandedCoverLetterId, setExpandedCoverLetterId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${resolvedParams.id}`,
        {
          headers: {
            'x-api-key': apiKey || '',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        setResumes(data.data.resumes);
        setCoverLetters(data.data.cover_letters);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details');
      router.push('/users');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireSuperAdmin>
        <Sidebar />
        <div className="min-h-screen bg-background ml-0 lg:ml-56">
          <div className="p-4 lg:p-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-text-secondary">Loading user details...</span>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute requireSuperAdmin>
      <Sidebar />
      <div className="min-h-screen bg-background ml-0 lg:ml-56">
        <div className="p-4 lg:p-8">
          {/* Back Button */}
          <Link
            href="/users"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Users
          </Link>

          {/* User Info Header */}
          <div className="bg-surface border border-accent rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-2xl">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{user.full_name}</h1>
                  <p className="text-text-secondary mb-2">{user.email}</p>
                  <div className="flex items-center gap-3">
                    {user.is_verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
                        Not Verified
                      </span>
                    )}
                    <span className="text-sm text-text-secondary">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface border border-accent rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Total Resumes</p>
                  <p className="text-2xl font-bold text-foreground">{resumes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-accent rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Cover Letters</p>
                  <p className="text-2xl font-bold text-foreground">{coverLetters.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-surface border border-accent rounded-lg overflow-hidden">
            <div className="border-b border-accent">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('resumes')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'resumes'
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-text-secondary hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  Resumes ({resumes.length})
                </button>
                <button
                  onClick={() => setActiveTab('cover-letters')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'cover-letters'
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-text-secondary hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  Cover Letters ({coverLetters.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'resumes' ? (
                <div>
                  {resumes.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-text-secondary">This user has not created any resumes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {resumes.map((resume) => {
                        const isExpanded = expandedResumeId === resume.id;
                        return (
                          <div
                            key={resume.id}
                            className="bg-background border border-accent rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                          >
                            {/* Resume Header */}
                            <div className="p-4 bg-surface border-b border-accent">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-10 h-12 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-foreground font-semibold mb-1">{resume.title}</h3>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                        {resume.template_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </span>
                                      {resume.target_role && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                                          {resume.target_role}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-4 text-xs text-text-secondary">
                                      <span>ID: #{resume.id}</span>
                                      <span>Updated: {new Date(resume.updated_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setExpandedResumeId(isExpanded ? null : resume.id)}
                                  className="flex-shrink-0 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded text-xs font-medium transition-colors"
                                >
                                  {isExpanded ? 'Hide Details' : 'Show Details'}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Content */}
                            {isExpanded && (
                              <div className="p-4 space-y-4">
                                {/* Professional Summary & Target Role */}
                                {(resume.professional_summary || resume.target_role) && (
                                  <div className="bg-surface border border-accent rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Summary & Role</h4>
                                    {resume.target_role && (
                                      <div className="mb-2">
                                        <span className="text-xs text-text-secondary">Target Role: </span>
                                        <span className="text-xs font-medium text-foreground">{resume.target_role}</span>
                                      </div>
                                    )}
                                    {resume.professional_summary && (
                                      <p className="text-xs text-text-secondary">{resume.professional_summary}</p>
                                    )}
                                  </div>
                                )}

                                {/* Personal Info */}
                                {resume.personal_info && (
                                  <div className="bg-surface border border-accent rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Personal Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                      {resume.personal_info.full_name && (
                                        <div><span className="text-text-secondary">Name:</span> <span className="text-foreground">{resume.personal_info.full_name}</span></div>
                                      )}
                                      {resume.personal_info.email && (
                                        <div><span className="text-text-secondary">Email:</span> <span className="text-foreground">{resume.personal_info.email}</span></div>
                                      )}
                                      {resume.personal_info.phone && (
                                        <div><span className="text-text-secondary">Phone:</span> <span className="text-foreground">{resume.personal_info.phone}</span></div>
                                      )}
                                      {resume.personal_info.city && (
                                        <div><span className="text-text-secondary">City:</span> <span className="text-foreground">{resume.personal_info.city}</span></div>
                                      )}
                                      {resume.personal_info.address && (
                                        <div className="md:col-span-2"><span className="text-text-secondary">Address:</span> <span className="text-foreground">{resume.personal_info.address}</span></div>
                                      )}
                                      {resume.personal_info.linkedin_url && (
                                        <div className="md:col-span-2">
                                          <span className="text-text-secondary">LinkedIn:</span> 
                                          <a href={resume.personal_info.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                                            {resume.personal_info.linkedin_url}
                                          </a>
                                        </div>
                                      )}
                                      {resume.personal_info.portfolio_url && (
                                        <div className="md:col-span-2">
                                          <span className="text-text-secondary">Portfolio:</span>
                                          <a href={resume.personal_info.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                                            {resume.personal_info.portfolio_url}
                                          </a>
                                        </div>
                                      )}
                                      {resume.personal_info.github_url && (
                                        <div className="md:col-span-2">
                                          <span className="text-text-secondary">GitHub:</span>
                                          <a href={resume.personal_info.github_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                                            {resume.personal_info.github_url}
                                          </a>
                                        </div>
                                      )}
                                      {resume.personal_info.website_url && (
                                        <div className="md:col-span-2">
                                          <span className="text-text-secondary">Website:</span>
                                          <a href={resume.personal_info.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                                            {resume.personal_info.website_url}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Experience */}
                                {resume.experience.length > 0 && (
                                  <div className="bg-surface border border-accent rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Experience ({resume.experience.length})</h4>
                                    <div className="space-y-3">
                                      {resume.experience.map((exp) => (
                                        <div key={exp.id} className="pb-3 border-b border-accent last:border-0 last:pb-0">
                                          <p className="text-sm font-medium text-foreground">{exp.job_title}</p>
                                          <p className="text-xs text-text-secondary mb-1">{exp.company_name}</p>
                                          <p className="text-xs text-text-secondary mb-2">{exp.start_date} - {exp.end_date || 'Present'}</p>
                                          {exp.description && (
                                            <p className="text-xs text-text-secondary">{exp.description}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Education */}
                                {resume.education.length > 0 && (
                                  <div className="bg-surface border border-accent rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Education ({resume.education.length})</h4>
                                    <div className="space-y-3">
                                      {resume.education.map((edu) => (
                                        <div key={edu.id} className="pb-3 border-b border-accent last:border-0 last:pb-0">
                                          <p className="text-sm font-medium text-foreground">{edu.degree}</p>
                                          <p className="text-xs text-text-secondary mb-1">{edu.institute_name}</p>
                                          <div className="flex gap-3 text-xs text-text-secondary">
                                            <span>{edu.start_year} - {edu.end_year}</span>
                                            {edu.grade && <span>Grade: {edu.grade}</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Skills & Languages */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {resume.skills.length > 0 && (
                                    <div className="bg-surface border border-accent rounded-lg p-4">
                                      <h4 className="text-sm font-semibold text-primary mb-3">Skills ({resume.skills.length})</h4>
                                      <div className="flex flex-wrap gap-1.5">
                                        {resume.skills.map((skill) => (
                                          <span key={skill.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                            {skill.skill_name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {resume.languages.length > 0 && (
                                    <div className="bg-surface border border-accent rounded-lg p-4">
                                      <h4 className="text-sm font-semibold text-primary mb-3">Languages ({resume.languages.length})</h4>
                                      <div className="flex flex-wrap gap-1.5">
                                        {resume.languages.map((lang) => (
                                          <span key={lang.id} className="px-2 py-1 bg-success/10 text-success rounded text-xs">
                                            {lang.language_name}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Projects */}
                                {resume.projects.length > 0 && (
                                  <div className="bg-surface border border-accent rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Projects ({resume.projects.length})</h4>
                                    <div className="space-y-3">
                                      {resume.projects.map((project) => (
                                        <div key={project.id} className="pb-3 border-b border-accent last:border-0 last:pb-0">
                                          <p className="text-sm font-medium text-foreground">{project.title}</p>
                                          {project.description && (
                                            <p className="text-xs text-text-secondary my-2">{project.description}</p>
                                          )}
                                          {project.technologies && (
                                            <div className="flex flex-wrap gap-1 my-2">
                                              {project.technologies.split(',').map((tech, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-accent text-foreground rounded text-[10px]">
                                                  {tech.trim()}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                          <div className="flex gap-3 text-xs text-text-secondary">
                                            {project.start_date && <span>{project.start_date} - {project.end_date || 'Present'}</span>}
                                            {project.project_url && (
                                              <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                View Project
                                              </a>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Certifications */}
                                {resume.certifications.length > 0 && (
                                  <div className="bg-surface border border-accent rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-primary mb-3">Certifications ({resume.certifications.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {resume.certifications.map((cert) => (
                                        <div key={cert.id} className="flex items-center justify-between">
                                          <span className="text-xs text-foreground">{cert.title}</span>
                                          <span className="text-xs text-text-secondary">{cert.year}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {coverLetters.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-text-secondary">
                        This user has not created any cover letters yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {coverLetters.map((letter) => {
                        const isExpanded = expandedCoverLetterId === letter.id;
                        return (
                          <div
                            key={letter.id}
                            className="bg-background border border-accent rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                          >
                            {/* Cover Letter Header */}
                            <div className="p-4 bg-surface border-b border-accent">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-10 h-12 bg-success/10 rounded flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-foreground font-semibold mb-1">
                                      {letter.job_title || 'Untitled Position'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      {letter.company_name && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                                          {letter.company_name}
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent text-foreground capitalize">
                                        {letter.tone}
                                      </span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-text-secondary">
                                      <span>ID: #{letter.id}</span>
                                      <span>Resume: {letter.resume_title}</span>
                                      <span>Created: {new Date(letter.created_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setExpandedCoverLetterId(isExpanded ? null : letter.id)}
                                  className="flex-shrink-0 px-3 py-1.5 bg-success/10 hover:bg-success/20 text-success rounded text-xs font-medium transition-colors"
                                >
                                  {isExpanded ? 'Hide Letter' : 'Read Letter'}
                                </button>
                              </div>
                            </div>

                            {/* Expandable Cover Letter Content */}
                            {isExpanded && letter.letter_text && (
                              <div className="p-4">
                                <div className="bg-surface border border-accent rounded-lg p-4">
                                  <h4 className="text-sm font-semibold text-success mb-3">Cover Letter Content</h4>
                                  <div className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                                    {letter.letter_text}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
