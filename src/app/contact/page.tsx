'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

import { apiGet, apiPut, apiDelete } from '@/lib/api';

interface ContactMessage {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function Contact() {
  const [allContacts, setAllContacts] = useState<ContactMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContactMessages();
  }, []);

  const fetchContactMessages = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet('/api/contact');

      if (data.success) {
        setAllContacts(data.data);
      }
    } catch (err) {
      console.error('Error fetching contact messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const data = await apiPut(`/api/contact/${id}/approve`, {});

      if (data.success) {
        await fetchContactMessages();
      } else {
        alert(data.error?.message || 'Failed to approve message');
      }
    } catch (err) {
      console.error('Error approving message:', err);
      alert('Failed to approve message');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this message?')) {
      return;
    }

    try {
      const data = await apiPut(`/api/contact/${id}/reject`, {});

      if (data.success) {
        await fetchContactMessages();
      } else {
        alert(data.error?.message || 'Failed to reject message');
      }
    } catch (err) {
      console.error('Error rejecting message:', err);
      alert('Failed to reject message');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const data = await apiDelete(`/api/contact/${id}`);

      if (data.success) {
        await fetchContactMessages();
      } else {
        alert(data.error?.message || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message');
    }
  };

  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = contact.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || contact.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Submissions</h1>
          <p className="text-text-secondary">View and manage contact form submissions from users</p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-lg p-6 shadow-lg border border-accent mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-background text-foreground border border-accent rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-lg p-4 border border-accent">
            <p className="text-text-secondary text-sm mb-1">Total Messages</p>
            <p className="text-2xl font-bold text-foreground">{allContacts.length}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-accent">
            <p className="text-text-secondary text-sm mb-1">Pending</p>
            <p className="text-2xl font-bold text-primary">{allContacts.filter(c => c.status === 'pending').length}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-accent">
            <p className="text-text-secondary text-sm mb-1">Approved</p>
            <p className="text-2xl font-bold text-success">{allContacts.filter(c => c.status === 'approved').length}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-accent">
            <p className="text-text-secondary text-sm mb-1">Rejected</p>
            <p className="text-2xl font-bold text-error">{allContacts.filter(c => c.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-text-secondary mt-4">Loading messages...</p>
          </div>
        ) : (
          <>
            {/* Contact Messages */}
            <div className="space-y-4">
              {filteredContacts.map((contact) => {
                const formattedDate = new Date(contact.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={contact.id} className="bg-surface rounded-lg p-6 shadow-lg border border-accent hover:border-primary/50 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-lg">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {contact.first_name} {contact.last_name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              contact.status === 'approved'
                                ? 'bg-success/10 text-success'
                                : contact.status === 'rejected'
                                ? 'bg-error/10 text-error'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {contact.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-text-secondary text-sm mt-1">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {contact.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formattedDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-foreground font-semibold mb-2">Subject:</h4>
                  <p className="text-foreground">{contact.subject}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-foreground font-semibold mb-2">Message:</h4>
                  <p className="text-text-secondary leading-relaxed">{contact.message}</p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-accent">
                  {contact.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleApprove(contact.id)}
                        className="bg-success/10 hover:bg-success/20 text-success font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(contact.id)}
                        className="bg-error/10 hover:bg-error/20 text-error font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </>
                  )}
                  <a
                    href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
                    className="bg-primary/10 hover:bg-primary/20 text-primary font-medium px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Reply via Email
                  </a>
                  <button 
                    onClick={() => handleDelete(contact.id)}
                    className="bg-accent hover:bg-accent/80 text-text-secondary font-medium px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
                  </div>
                );
              })}

              {filteredContacts.length === 0 && !isLoading && (
                <div className="bg-surface rounded-lg p-12 text-center border border-accent">
                  <svg className="w-16 h-16 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-text-secondary text-lg">No contact submissions found</p>
                  <p className="text-text-secondary text-sm mt-2">
                    {filterStatus !== 'all' ? 'Try adjusting your filter' : 'Contact messages will appear here when users submit them'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

