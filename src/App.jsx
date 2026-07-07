import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  UserPlus, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Send, 
  Users, 
  Award, 
  Smile, 
  Activity, 
  X,
  ShieldCheck,
  CheckCircle2,
  Database,
  Lock,
  Download,
  ArrowLeft
} from 'lucide-react';
import { supabase, isMockMode } from './supabaseClient';

const INITIAL_MOCK_DATA = [
  {
    id: "1",
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    full_name: "Sarah Jenkins",
    bib_name: "Sarah J",
    phone_number: "+60123456789",
    gender: "Female",
    class_name: "Degree",
    compete: "Yes",
    t_shirt_size: "M",
    bib_number: "0888"
  },
  {
    id: "2",
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    full_name: "Tan Wei Jie",
    bib_name: "Ah Jie",
    phone_number: "+60189998888",
    gender: "Male",
    class_name: "S2A",
    compete: "No",
    t_shirt_size: "XL",
    bib_number: "1314"
  },
  {
    id: "3",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    full_name: "Muhammad Bin Ridzuan",
    bib_name: "Wan",
    phone_number: "+601177776666",
    gender: "Male",
    class_name: "S2C",
    compete: "Yes",
    t_shirt_size: "L",
    bib_number: "0007"
  },
  {
    id: "4",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    full_name: "Chloe Lim",
    bib_name: "Chlo",
    phone_number: "+60176665555",
    gender: "Female",
    class_name: "Degree",
    compete: "Yes",
    t_shirt_size: "S",
    bib_number: "7777"
  },
  {
    id: "5",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    full_name: "Darren O'Connor",
    bib_name: "Daz",
    phone_number: "+60165554444",
    gender: "Male",
    class_name: "S2J",
    compete: "No",
    t_shirt_size: "XXL",
    bib_number: "0420"
  }
];

function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // App Global State
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Admin Dashboard State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminData, setAdminData] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [bibName, setBibName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('Male');
  const [className, setClassName] = useState('S2A');
  const [compete, setCompete] = useState('Yes');
  const [tShirtSize, setTShirtSize] = useState('M');
  const [bibNumber, setBibNumber] = useState('');
  const [waiverAccepted, setWaiverAccepted] = useState(false);

  // Warnings / Validation State
  const [bibWarning, setBibWarning] = useState('');
  const [phoneWarning, setPhoneWarning] = useState('');
  const [formError, setFormError] = useState('');

  const modalRef = useRef(null);

  // Path check routing listener
  useEffect(() => {
    const checkPath = () => {
      setIsAdminRoute(window.location.pathname === '/admin');
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  useEffect(() => {
    if (!isAdminRoute) {
      fetchPublicRegistrations();
    }
  }, [isAdminRoute]);

  const fetchPublicRegistrations = async () => {
    setLoading(true);
    if (isMockMode) {
      const stored = localStorage.getItem('funrun_registrations');
      if (stored) {
        setRegistrations(JSON.parse(stored));
      } else {
        localStorage.setItem('funrun_registrations', JSON.stringify(INITIAL_MOCK_DATA));
        setRegistrations(INITIAL_MOCK_DATA);
      }
      setLoading(false);
    } else {
      try {
        const { data, error } = await supabase
          .from('public_registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRegistrations(data || []);
      } catch (error) {
        console.error('Error fetching registrations:', error.message);
        showToast('Error loading registered list', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        if (adminPassword === 'admin123') {
          setIsAdminLoggedIn(true);
          const stored = localStorage.getItem('funrun_registrations');
          setAdminData(stored ? JSON.parse(stored) : INITIAL_MOCK_DATA);
        } else {
          setAdminError('Invalid password. Try "admin123".');
        }
        setAdminLoading(false);
      }, 500);
    } else {
      try {
        const { data, error } = await supabase
          .rpc('get_all_registrations', { admin_password: adminPassword });

        if (error) throw error;
        setAdminData(data || []);
        setIsAdminLoggedIn(true);
      } catch (error) {
        console.error('Admin Auth Error:', error.message);
        setAdminError(error.message || 'Access Denied. Check password.');
      } finally {
        setAdminLoading(false);
      }
    }
  };

  const downloadExcel = () => {
    const dataToExport = adminData.filter(reg => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        reg.full_name?.toLowerCase().includes(q) ||
        reg.bib_name?.toLowerCase().includes(q) ||
        reg.bib_number?.includes(q) ||
        reg.phone_number?.includes(q) ||
        reg.class_name?.toLowerCase().includes(q)
      );
    });

    if (dataToExport.length === 0) {
      showToast('No registration data available to export.', 'error');
      return;
    }

    const headers = ['BIB Number', 'Name on BIB', 'Full Name', 'Phone Number', 'Gender', 'Class', 'Prize Racer', 'T-Shirt Size', 'Register Date'];
    const rows = dataToExport.map(reg => [
      reg.bib_number,
      `"${reg.bib_name.replace(/"/g, '""')}"`,
      `"${reg.full_name.replace(/"/g, '""')}"`,
      `"${reg.phone_number}"`,
      reg.gender,
      reg.class_name,
      reg.compete,
      reg.t_shirt_size,
      new Date(reg.created_at).toLocaleString()
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Limkokwing_FunRun_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported registrations to CSV successfully!');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setFullName('');
    setBibName('');
    setPhoneNumber('');
    setGender('Male');
    setClassName('S2A');
    setCompete('Yes');
    setTShirtSize('M');
    setBibNumber('');
    setWaiverAccepted(false);
    setBibWarning('');
    setPhoneWarning('');
    setFormError('');
  };

  const openModal = () => {
    resetForm();
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  const closeModal = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
    resetForm();
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) {
      closeModal();
    }
  };

  const handleBibChange = (val) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 4);
    setBibNumber(sanitized);
    setBibWarning('');

    if (sanitized.length === 4) {
      checkBibTaken(sanitized);
    }
  };

  const checkBibTaken = async (number) => {
    if (isMockMode) {
      const taken = registrations.some(r => r.bib_number === number);
      if (taken) {
        setBibWarning(`BIB number ${number} is already taken!`);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('public_registrations')
          .select('bib_number')
          .eq('bib_number', number)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setBibWarning(`BIB number ${number} is already taken!`);
        }
      } catch (err) {
        console.error('Error checking BIB:', err);
      }
    }
  };

  const checkPhoneDuplicate = async () => {
    if (!phoneNumber) return;
    setPhoneWarning('');

    if (isMockMode) {
      const taken = registrations.some(r => r.phone_number === phoneNumber);
      if (taken) {
        setPhoneWarning('This phone number is already registered!');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) return setFormError('Full Name is required.');
    if (!bibName.trim()) return setFormError('BIB Name is required.');
    if (!phoneNumber.trim()) return setFormError('Phone Number is required.');
    if (bibNumber.length !== 4) return setFormError('BIB Number must be exactly 4 digits.');
    if (!waiverAccepted) return setFormError('You must agree to the Health & Liability Waiver.');
    if (bibWarning) return setFormError('The BIB number is already taken. Please choose another.');
    if (phoneWarning) return setFormError('This phone number is already registered.');

    setSubmitting(true);

    const newRecord = {
      full_name: fullName.trim(),
      bib_name: bibName.trim(),
      phone_number: phoneNumber.trim(),
      gender,
      class_name: className,
      compete,
      t_shirt_size: tShirtSize,
      bib_number: bibNumber
    };

    if (isMockMode) {
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('funrun_registrations') || '[]');
        
        const bibTaken = stored.some(r => r.bib_number === bibNumber);
        const phoneTaken = stored.some(r => r.phone_number === phoneNumber.trim());

        if (bibTaken) {
          setBibWarning(`BIB number ${bibNumber} is already taken!`);
          setFormError('Registration failed: BIB number already taken.');
          setSubmitting(false);
          return;
        }

        if (phoneTaken) {
          setPhoneWarning('This phone number is already registered!');
          setFormError('Registration failed: One registration per phone number.');
          setSubmitting(false);
          return;
        }

        const completeRecord = {
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          ...newRecord
        };

        const updated = [completeRecord, ...stored];
        localStorage.setItem('funrun_registrations', JSON.stringify(updated));
        setRegistrations(updated);
        
        setSubmitting(false);
        closeModal();
        showToast('Successfully registered for Limkokwing Fun Run!');
      }, 700);
    } else {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .insert([newRecord]);

        if (error) {
          if (error.code === '23505') {
            if (error.message.includes('bib_number') || error.details?.includes('bib_number')) {
              setBibWarning(`BIB number ${bibNumber} is already taken!`);
              throw new Error('This BIB number is already taken. Please choose another.');
            }
            if (error.message.includes('phone_number') || error.details?.includes('phone_number')) {
              setPhoneWarning('This phone number is already registered.');
              throw new Error('This phone number has already been registered. One entry per person.');
            }
          }
          throw error;
        }

        await fetchPublicRegistrations();
        setSubmitting(false);
        closeModal();
        showToast('Successfully registered!');
      } catch (err) {
        setFormError(err.message || 'An error occurred during submission.');
        setSubmitting(false);
      }
    }
  };

  const filteredPublicRegistrations = registrations.filter(reg => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      reg.full_name?.toLowerCase().includes(q) ||
      reg.bib_name?.toLowerCase().includes(q) ||
      reg.bib_number?.includes(q)
    );
  });

  const filteredAdminRegistrations = adminData.filter(reg => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      reg.full_name?.toLowerCase().includes(q) ||
      reg.bib_name?.toLowerCase().includes(q) ||
      reg.bib_number?.includes(q) ||
      reg.phone_number?.includes(q) ||
      reg.class_name?.toLowerCase().includes(q)
    );
  });

  const totalRegistered = registrations.length;
  const competitiveCount = registrations.filter(r => r.compete === 'Yes').length;

  return (
    <div className="app-container">
      {/* Liquid background grids */}
      <div className="background-glow" />

      <div>
        {/* Navigation bar with exact centered container boundaries */}
        <nav className="glass-nav">
          <div className="nav-container">
            <div className="cursor-pointer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={() => navigateTo('/')}>
              <div className="stat-icon-box pulse-glow">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-gradient glow-text" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  LIMKOKWING
                </h1>
                <p className="font-heading" style={{ fontSize: '0.65rem', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '-2px' }}>
                  SiemReap Fun Run
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isAdminRoute ? (
                <button 
                  onClick={() => navigateTo('/')}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigateTo('/admin')}
                    className="btn-secondary"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>Admin Panel</span>
                  </button>
                  <button 
                    onClick={openModal}
                    className="btn-primary pulse-glow"
                    style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register BIB</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main layout container with fixed max-width, margins, and padding */}
        {isAdminRoute ? (
          /* ==========================================
             ADMIN DASHBOARD ROUTE
             ========================================== */
          <main className="main-content">
            {!isAdminLoggedIn ? (
              /* Password login panel */
              <div className="glass-panel" style={{ maxWidth: '420px', margin: '4rem auto 0 auto', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#00f0ff' }}>
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="font-heading" style={{ fontSize: '1.5rem', color: '#fff' }}>Admin Panel</h2>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Please enter admin password</p>
                </div>

                <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {adminError && (
                    <div className="form-warning" style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="admin-pass" className="form-label">Password</label>
                    <input
                      type="password"
                      id="admin-pass"
                      required
                      placeholder="Enter Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="glass-input"
                      style={{ textAlign: 'center', letterSpacing: '0.25em' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    disabled={adminLoading}
                  >
                    {adminLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated Admin view */
              <section className="glass-panel roster-panel">
                <div className="admin-header-row">
                  <div className="admin-title-box">
                    <h2>Admin Master Roster</h2>
                    <p>Manage, search, and download all participant records</p>
                  </div>

                  <div className="admin-controls-box">
                    <div className="admin-search-wrapper">
                      <span className="search-icon-box">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search roster..."
                        className="glass-input search-input"
                        style={{ fontSize: '0.85rem', padding: '0.65rem 1rem' }}
                      />
                    </div>

                    <button 
                      onClick={downloadExcel}
                      className="btn-primary"
                      style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Excel (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Total Runners</p>
                    <p className="admin-stat-value">{adminData.length}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Male</p>
                    <p className="admin-stat-value" style={{ color: '#0052ff' }}>{adminData.filter(r => r.gender === 'Male').length}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Female</p>
                    <p className="admin-stat-value" style={{ color: '#ff007f' }}>{adminData.filter(r => r.gender === 'Female').length}</p>
                  </div>
                  <div className="admin-stat-card">
                    <p className="admin-stat-label">Competing</p>
                    <p className="admin-stat-value" style={{ color: '#00f0ff' }}>{adminData.filter(r => r.compete === 'Yes').length}</p>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>BIB</th>
                        <th>BIB Name</th>
                        <th>Full Name</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Class</th>
                        <th>T-Shirt</th>
                        <th>Compete</th>
                        <th style={{ textAlign: 'right' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No participant records found.
                          </td>
                        </tr>
                      ) : (
                        filteredAdminRegistrations.map((reg) => (
                          <tr key={reg.id}>
                            <td className="font-heading" style={{ fontWeight: 700, color: '#00f0ff' }}>{reg.bib_number}</td>
                            <td style={{ color: '#fff', fontWeight: 600 }}>{reg.bib_name}</td>
                            <td>{reg.full_name}</td>
                            <td style={{ fontFamily: 'monospace', color: '#00f0ff' }}>{reg.phone_number}</td>
                            <td>{reg.gender}</td>
                            <td style={{ color: '#94a3b8' }}>{reg.class_name}</td>
                            <td style={{ fontWeight: 600 }}>{reg.t_shirt_size}</td>
                            <td>
                              <span className={`compete-tag ${reg.compete === 'Yes' ? 'yes' : 'no'}`}>
                                {reg.compete === 'Yes' ? 'Compete' : 'Fun Run'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', color: '#64748b' }}>
                              {new Date(reg.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </main>
        ) : (
          /* ==========================================
             PUBLIC USER VIEW ROUTE
             ========================================== */
          <main className="main-content">
            {/* Hero Landing */}
            <section className="hero-section">
              <div className="hero-subtitle">
                <span>⚡ Limkokwing SiemReap Fun Run</span>
              </div>
              <h2 className="hero-title">
                Claim Your <span className="text-gradient glow-text">BIB Number</span>
              </h2>
              <p className="hero-desc">
                Choose your unique 4-digit code. Compete for awards or join for fun! Search below to verify which numbers are already taken.
              </p>
            </section>

            {/* Centered Stats Cards Pods */}
            <section className="stats-row">
              {/* Card 1: Total Registered */}
              <div className="stat-pod">
                <div className="stat-info">
                  <span className="stat-label">Total Registered</span>
                  <span className="stat-value">{loading ? '...' : totalRegistered}</span>
                </div>
                <div className="stat-icon-box">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>

              {/* Card 2: Competing for Prizes */}
              <div className="stat-pod">
                <div className="stat-info">
                  <span className="stat-label">Competing for Award</span>
                  <span className="stat-value">{loading ? '...' : competitiveCount}</span>
                </div>
                <div className="stat-icon-box cyan">
                  <Award className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </section>

            {/* Public Roster list card panel */}
            <section className="glass-panel roster-panel">
              <div className="roster-header">
                <div className="roster-title-box">
                  <h3>Registered Roster</h3>
                  <p>Check taken BIB numbers before registering</p>
                </div>

                {/* Search Bar Wrapper */}
                <div className="search-wrapper">
                  <span className="search-icon-box">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or BIB number..."
                    className="glass-input search-input"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="clear-search-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Cards Grid */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
                  Loading registrations...
                </div>
              ) : filteredPublicRegistrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  {searchQuery ? 'No runners matching your search.' : 'No registrations yet. Be the first to register!'}
                </div>
              ) : (
                <div className="runner-grid">
                  {filteredPublicRegistrations.map((reg) => (
                    <div key={reg.id} className="runner-card">
                      <div className="bib-badge">
                        <span className="bib-badge-num">{reg.bib_number}</span>
                        <span className="bib-badge-label">BIB</span>
                      </div>
                      <div className="runner-info">
                        <h4 className="runner-bib-name">{reg.bib_name}</h4>
                        <p className="runner-full-name">{reg.full_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        )}
      </div>

      {/* Footer Area with Sora credit badge */}
      <footer className="footer-container">
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <p>© 2026 Limkokwing SiemReap Fun Run. All rights reserved.</p>
          <p style={{ marginTop: '0.25rem' }}>Designed with a modern Liquid Glass Theme.</p>
        </div>

        {/* Credit Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/25 text-[10px] text-cyan-400 font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/5" style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '999px', fontSize: '0.65rem', color: '#00f0ff', letterSpacing: '1px', textTransform: 'uppercase', gap: '0.35rem' }}>
          <Smile className="w-3 h-3 text-cyan-400" />
          <span>Made by Sora</span>
        </div>
      </footer>

      {/* Registration Modal Dialog */}
      <dialog 
        ref={modalRef} 
        onClick={handleBackdropClick}
        className="registration-modal"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Fun Run Registration
            </h3>
            <p>Complete details below to secure your spot</p>
          </div>
          <button 
            onClick={closeModal}
            className="clear-search-btn"
            style={{ position: 'static', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRegister} className="modal-body-form">
          {formError && (
            <div className="form-warning" style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="full-name" className="form-label">Full Name</label>
            <input
              type="text"
              id="full-name"
              required
              placeholder="e.g. Johnathan Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* BIB Name */}
          <div className="form-group">
            <label htmlFor="bib-name" className="form-label">Name on the BIB (Nickname)</label>
            <input
              type="text"
              id="bib-name"
              required
              maxLength="15"
              placeholder="e.g. Johnny (Max 15 chars)"
              value={bibName}
              onChange={(e) => setBibName(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone-number" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="phone-number"
              required
              placeholder="e.g. +60123456789"
              value={phoneNumber}
              onBlur={checkPhoneDuplicate}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setPhoneWarning('');
              }}
              className="glass-input"
            />
            {phoneWarning && (
              <p className="form-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> {phoneWarning}
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="form-group">
            <span className="form-label">Gender</span>
            <div className="custom-radio-group">
              <label className="custom-radio-card">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={gender === 'Male'}
                  onChange={() => setGender('Male')}
                />
                Male
              </label>
              <label className="custom-radio-card">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={gender === 'Female'}
                  onChange={() => setGender('Female')}
                />
                Female
              </label>
            </div>
          </div>

          {/* Class */}
          <div className="form-group">
            <label htmlFor="class-select" className="form-label">Class / Category</label>
            <select
              id="class-select"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="glass-input"
            >
              {['S2A', 'S2B', 'S2C', 'S2D', 'S2E', 'S2F', 'S2G', 'S2H', 'S2I', 'S2J', 'S1A', 'Degree'].map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">{cls}</option>
              ))}
            </select>
          </div>

          {/* Compete */}
          <div className="form-group">
            <span className="form-label">Would you like to compete for the prize?</span>
            <div className="custom-radio-group">
              <label className="custom-radio-card">
                <input
                  type="radio"
                  name="compete"
                  value="Yes"
                  checked={compete === 'Yes'}
                  onChange={() => setCompete('Yes')}
                />
                Yes
              </label>
              <label className="custom-radio-card">
                <input
                  type="radio"
                  name="compete"
                  value="No"
                  checked={compete === 'No'}
                  onChange={() => setCompete('No')}
                />
                No (Join for Fun)
              </label>
            </div>
          </div>

          {/* T-Shirt */}
          <div className="form-group">
            <span className="form-label">T-Shirt Size</span>
            <div className="t-shirt-grid">
              {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(size => (
                <label key={size} className="custom-radio-card">
                  <input
                    type="radio"
                    name="t-shirt-size"
                    value={size}
                    checked={tShirtSize === size}
                    onChange={() => setTShirtSize(size)}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>

          {/* BIB Number */}
          <div className="form-group">
            <label htmlFor="bib-number" className="form-label">Choose 4-Digit BIB Number</label>
            <input
              type="text"
              id="bib-number"
              required
              pattern="\d{4}"
              inputmode="numeric"
              placeholder="e.g. 0007"
              value={bibNumber}
              onChange={(e) => handleBibChange(e.target.value)}
              className="glass-input tracking-widest font-heading"
              style={{ fontWeight: 700, fontSize: '1.25rem', textAlign: 'center' }}
            />
            {bibWarning ? (
              <p className="form-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> {bibWarning}
              </p>
            ) : bibNumber.length === 4 ? (
              <p className="form-success">
                <Check className="w-3.5 h-3.5" /> BIB Number {bibNumber} is available!
              </p>
            ) : null}
            <p className="form-hint">Must be exactly 4 digits. (e.g. 0001, 0023, 9999).</p>
          </div>

          {/* Telegram Channel */}
          <div className="telegram-pod">
            <div className="telegram-info">
              <p className="telegram-label">
                <Send className="w-3.5 h-3.5" /> Telegram Updates
              </p>
              <p className="telegram-desc">Join the official Telegram Channel to stay updated on event news.</p>
            </div>
            <a 
              href="https://t.me/+YR_yDNr5CaJjNTI1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Join Channel
            </a>
          </div>

          {/* Waiver */}
          <div className="form-group" style={{ paddingTop: '0.5rem' }}>
            <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Health & Liability Waiver
            </span>
            <div className="waiver-text-box">
              "I confirm that I am physically fit to participate in a 3KM run and accept full responsibility for my own safety during the event."
            </div>
            
            <label className="checkbox-container" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
                required
              />
              <div className="checkbox-box"></div>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500, userSelect: 'none' }}>
                I agree and accept.
              </span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={closeModal}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting || !!bibWarning || !!phoneWarning || !waiverAccepted}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
          </div>

        </form>
      </dialog>
    </div>
  );
}

export default App;
