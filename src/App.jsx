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

  // App State
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

  // Validation Warnings
  const [bibWarning, setBibWarning] = useState('');
  const [phoneWarning, setPhoneWarning] = useState('');
  const [formError, setFormError] = useState('');

  const modalRef = useRef(null);

  // Path check routing
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
        showToast('Error loading registered roster', 'error');
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
        console.error('Admin authentication error:', error.message);
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
      showToast('No record found to export.', 'error');
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
    link.setAttribute('download', `FunRun_Participants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported registrations roster!');
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
        console.error(err);
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
    if (!waiverAccepted) return setFormError('You must accept the waiver.');
    if (bibWarning) return setFormError('BIB number is taken.');
    if (phoneWarning) return setFormError('Phone number already registered.');

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
          setBibWarning(`BIB ${bibNumber} taken!`);
          setFormError('BIB number already taken.');
          setSubmitting(false);
          return;
        }

        if (phoneTaken) {
          setPhoneWarning('Phone number already registered!');
          setFormError('Phone number already registered.');
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
        showToast('Successfully registered for Fun Run!');
      }, 700);
    } else {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .insert([newRecord]);

        if (error) {
          if (error.code === '23505') {
            if (error.message.includes('bib_number') || error.details?.includes('bib_number')) {
              setBibWarning(`BIB ${bibNumber} is already taken!`);
              throw new Error('BIB number already taken. Choose another.');
            }
            if (error.message.includes('phone_number') || error.details?.includes('phone_number')) {
              setPhoneWarning('Phone number already registered.');
              throw new Error('Phone number already registered. Only 1 entry per person.');
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
  // Calculate how many people join to compete for the prizes (compete === 'Yes')
  const competitiveCount = registrations.filter(r => r.compete === 'Yes').length;

  return (
    <div className="relative min-h-screen pb-12 flex flex-col justify-between">
      <div className="background-glow" />

      {/* Preview Alert */}
      {isMockMode && (
        <div className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 backdrop-blur-md border-b border-cyan-500/20 text-cyan-200 py-2.5 px-4 text-center text-xs flex items-center justify-center gap-2 z-50 sticky top-0">
          <Database className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>
            <strong>Preview Active:</strong> Database variables missing. Sync locally using local storage. Set variables on Vercel for real database.
          </span>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl border backdrop-blur-xl transition-all shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'error' 
            ? 'bg-red-950/80 border-red-500/30 text-red-200' 
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div>
        {/* Navigation */}
        <nav className="glass-nav sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-gradient">
                  LIMKOKWING
                </h1>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest -mt-1">
                  SiemReap Fun Run
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdminRoute ? (
                <button 
                  onClick={() => navigateTo('/')}
                  className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigateTo('/admin')}
                    className="btn-secondary py-2.5 px-4 text-sm flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span>Admin Panel</span>
                  </button>
                  <button 
                    onClick={openModal}
                    className="btn-primary pulse-glow"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">Register BIB</span>
                    <span className="sm:hidden">Register</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ADMIN DASHBOARD VIEW */}
        {isAdminRoute ? (
          <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
            {!isAdminLoggedIn ? (
              /* Password Gate */
              <div className="max-w-md mx-auto mt-16 glass-panel p-8">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400 mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-white">Admin Authentication</h2>
                  <p className="text-sm text-gray-400 mt-1">Please enter your database admin password</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  {adminError && (
                    <div className="p-3 bg-red-950/60 border border-red-500/20 text-red-200 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="admin-pass" className="block text-sm font-semibold text-gray-300">
                      Password
                    </label>
                    <input
                      type="password"
                      id="admin-pass"
                      required
                      placeholder="Enter Admin Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="glass-input text-center tracking-widest"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary w-full mt-2"
                    disabled={adminLoading}
                  >
                    {adminLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Authenticate'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated Admin Dashboard */
              <section className="glass-panel p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-gradient glow-text">Admin Master Roster</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage, search, and download all participant records</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    {/* Admin Search */}
                    <div className="relative max-w-xs w-full">
                      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search roster..."
                        className="glass-input pl-9 py-2 text-sm"
                      />
                    </div>

                    {/* Download */}
                    <button 
                      onClick={downloadExcel}
                      className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Excel (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Runners</p>
                    <p className="text-xl font-bold text-white mt-0.5">{adminData.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Male</p>
                    <p className="text-xl font-bold text-blue-400 mt-0.5">{adminData.filter(r => r.gender === 'Male').length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Female</p>
                    <p className="text-xl font-bold text-pink-400 mt-0.5">{adminData.filter(r => r.gender === 'Female').length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Competing for Award</p>
                    <p className="text-xl font-bold text-cyan-400 mt-0.5">{adminData.filter(r => r.compete === 'Yes').length}</p>
                  </div>
                </div>

                {/* Table container */}
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] text-xs font-semibold text-cyan-400 uppercase tracking-wider border-b border-white/5">
                        <th className="py-4 px-4 font-heading">BIB</th>
                        <th className="py-4 px-4">BIB Name</th>
                        <th className="py-4 px-4">Full Name</th>
                        <th className="py-4 px-4">Phone</th>
                        <th className="py-4 px-4">Gender</th>
                        <th className="py-4 px-4">Class</th>
                        <th className="py-4 px-4">T-Shirt</th>
                        <th className="py-4 px-4">Compete</th>
                        <th className="py-4 px-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                      {filteredAdminRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-gray-500">No records found.</td>
                        </tr>
                      ) : (
                        filteredAdminRegistrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4 font-heading font-bold text-cyan-400">{reg.bib_number}</td>
                            <td className="py-4 px-4 text-white font-medium">{reg.bib_name}</td>
                            <td className="py-4 px-4">{reg.full_name}</td>
                            <td className="py-4 px-4 font-mono text-cyan-200">{reg.phone_number}</td>
                            <td className="py-4 px-4">{reg.gender}</td>
                            <td className="py-4 px-4 text-gray-400">{reg.class_name}</td>
                            <td className="py-4 px-4 font-semibold">{reg.t_shirt_size}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded ${
                                reg.compete === 'Yes' ? 'bg-blue-950 text-blue-300' : 'bg-emerald-950 text-emerald-300'
                              }`}>
                                {reg.compete === 'Yes' ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right text-gray-500">
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
          /* STANDARD USER VIEW */
          <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
            {/* Hero Section */}
            <section className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold mb-4 tracking-wide uppercase">
                <span>⚡ Limkokwing SiemReap Fun Run</span>
              </div>
              <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
                Claim Your <span className="text-gradient glow-text">BIB Number</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
                Choose your unique 4-digit code. Compete for prizes or join for fun! Search below to see what numbers are taken.
              </p>
            </section>

            {/* Centered Stats Panels (Total Registered & Competing for Award) */}
            <section className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
              {/* Total Registered */}
              <div className="glass-panel p-6 flex items-center justify-between w-full max-w-[280px]">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Registered</p>
                  <h3 className="font-heading text-3xl font-bold text-white mt-1">{loading ? '...' : totalRegistered}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Competing for Prizes */}
              <div className="glass-panel p-6 flex items-center justify-between w-full max-w-[280px]">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Competing for Award</p>
                  <h3 className="font-heading text-3xl font-bold text-cyan-400 mt-1">{loading ? '...' : competitiveCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* Public Roster List */}
            <section className="glass-panel p-8 sm:p-10">
              <div className="flex flex-col items-center text-center gap-4 mb-8">
                <div>
                  <h3 className="font-heading text-2xl font-bold text-white">Registered Roster</h3>
                  <p className="text-sm text-gray-400 mt-1">Check taken BIB numbers before registering</p>
                </div>

                {/* Search Bar (Centered) */}
                <div className="relative max-w-md w-full mt-2">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-cyan-400">
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or BIB number..."
                    className="glass-input pl-10 text-center"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Roster Cards Grid (Centered flex container) */}
              {loading ? (
                <div className="py-12 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
                  Loading registrations...
                </div>
              ) : filteredPublicRegistrations.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  {searchQuery ? 'No runners matching your search.' : 'No registrations yet.'}
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
      <footer className="max-w-6xl mx-auto px-4 mt-16 text-center space-y-4">
        <div className="text-xs text-gray-500">
          <p>© 2026 Limkokwing SiemReap Fun Run. All rights reserved.</p>
          <p className="mt-1">Designed with a modern Liquid Glass Theme.</p>
        </div>

        {/* Credit Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/25 text-[10px] text-cyan-400 font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/5">
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.01]">
          <div>
            <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Fun Run Registration
            </h3>
            <p className="text-xs text-gray-400">Complete details below to secure your spot</p>
          </div>
          <button 
            onClick={closeModal}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-500/20 text-red-200 rounded-xl text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="full-name" className="block text-sm font-semibold text-gray-300">
              Full Name
            </label>
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
          <div className="space-y-2">
            <label htmlFor="bib-name" className="block text-sm font-semibold text-gray-300">
              Name on the BIB (Nickname)
            </label>
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
          <div className="space-y-2">
            <label htmlFor="phone-number" className="block text-sm font-semibold text-gray-300">
              Phone Number
            </label>
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
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> {phoneWarning}
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-300">Gender</span>
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
          <div className="space-y-2">
            <label htmlFor="class-select" className="block text-sm font-semibold text-gray-300">Class / Category</label>
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
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-300">Would you like to compete for the prize?</span>
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
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-300">T-Shirt Size</span>
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
          <div className="space-y-2">
            <label htmlFor="bib-number" className="block text-sm font-semibold text-gray-300">Choose 4-Digit BIB Number</label>
            <input
              type="text"
              id="bib-number"
              required
              pattern="\d{4}"
              inputmode="numeric"
              placeholder="e.g. 0007"
              value={bibNumber}
              onChange={(e) => handleBibChange(e.target.value)}
              className="glass-input tracking-widest font-heading font-bold text-center text-lg"
            />
            {bibWarning ? (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> {bibWarning}
              </p>
            ) : bibNumber.length === 4 ? (
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <Check className="w-3.5 h-3.5" /> BIB Number {bibNumber} is available!
              </p>
            ) : null}
            <p className="text-[11px] text-gray-500">Must be exactly 4 digits. (e.g. 0001, 0023, 9999).</p>
          </div>

          {/* Telegram Channel */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Send className="w-3.5 h-3.5" /> Telegram Updates
              </p>
              <p className="text-xs text-gray-400 mt-1">Join the official Telegram Channel to stay updated on event news.</p>
            </div>
            <a 
              href="https://t.me/+YR_yDNr5CaJjNTI1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1 text-cyan-400 hover:text-white"
            >
              Join Channel
            </a>
          </div>

          {/* Waiver */}
          <div className="space-y-3 pt-2">
            <span className="block text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Health & Liability Waiver
            </span>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400 leading-relaxed">
              "I confirm that I am physically fit to participate in a 3KM run and accept full responsibility for my own safety during the event."
            </div>
            
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
                required
              />
              <div className="checkbox-box"></div>
              <span className="text-sm text-gray-300 font-medium select-none">
                I agree and accept.
              </span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-white/5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-white/[0.01]">
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
