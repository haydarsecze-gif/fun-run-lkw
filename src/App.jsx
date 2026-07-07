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
  Database
} from 'lucide-react';
import { supabase, isMockMode } from './supabaseClient';

// Helper to generate initial dummy data in mock/preview mode so the page isn't blank
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
  // State
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

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

  // Refs
  const modalRef = useRef(null);

  // Load registered runners
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    if (isMockMode) {
      // Local storage fallback for Preview Mode
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
        // Fetch public registrations view (protects phone numbers)
        const { data, error } = await supabase
          .from('public_registrations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRegistrations(data || []);
      } catch (error) {
        console.error('Error fetching registrations:', error.message);
        showToast('Error loading registrations from database', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Reset Form
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

  // Open Modal Dialog
  const openModal = () => {
    resetForm();
    if (modalRef.current) {
      modalRef.current.showModal();
    }
  };

  // Close Modal Dialog
  const closeModal = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
    resetForm();
  };

  // Close when clicking backdrop (light dismiss)
  const handleBackdropClick = (e) => {
    if (modalRef.current && e.target === modalRef.current) {
      closeModal();
    }
  };

  // Live validation on BIB Number change/blur
  const handleBibChange = (val) => {
    // Keep only digits and limit to 4 characters max
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
      } else {
        setBibWarning('');
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
        } else {
          setBibWarning('');
        }
      } catch (err) {
        console.error('Error checking BIB:', err);
      }
    }
  };

  // Live check on phone duplicate on blur
  const checkPhoneDuplicate = async () => {
    if (!phoneNumber) return;
    setPhoneWarning('');

    if (isMockMode) {
      const taken = registrations.some(r => r.phone_number === phoneNumber);
      if (taken) {
        setPhoneWarning('This phone number is already registered!');
      }
    } else {
      try {
        // We select from the main registrations table using supabase. Since registrations select policy is disabled,
        // we can query standard view to see if there's any record matching. Oh wait, the public_registrations view
        // doesn't have phone_number. So we can't query view for phone_number.
        // Wait, how does the client verify phone number is duplicate before submission?
        // We don't necessarily have to verify on blur for real DB if select on registrations table is disabled;
        // instead, when the user clicks Submit, we run insert, and handle the unique key violation!
        // That is very clean. But we can also check if we can query registrations directly? If we want to check
        // on blur, we would need select permissions. Since we disabled select to protect privacy, we will rely
        // on the insert response for real DB duplicates, which is the industry standard for privacy-first apps.
        // But for mock mode, we check it locally.
      } catch (err) {
        console.error('Error checking phone duplicate:', err);
      }
    }
  };

  // Form Submit Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validations
    if (!fullName.trim()) return setFormError('Full Name is required.');
    if (!bibName.trim()) return setFormError('BIB Name is required.');
    if (!phoneNumber.trim()) return setFormError('Phone Number is required.');
    if (bibNumber.length !== 4) return setFormError('BIB Number must be exactly 4 digits (e.g. 0001).');
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
      // Delay to simulate database roundtrip
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('funrun_registrations') || '[]');
        
        // Final duplicate check
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
      }, 800);
    } else {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .insert([newRecord])
          .select();

        if (error) {
          // Parse Supabase duplicate constraints error codes
          if (error.code === '23505') {
            if (error.message.includes('bib_number')) {
              setBibWarning(`BIB number ${bibNumber} is already taken!`);
              throw new Error('This BIB number is already taken. Please choose another 4-digit number.');
            }
            if (error.message.includes('phone_number')) {
              setPhoneWarning('This phone number is already registered.');
              throw new Error('This phone number has already been registered. One registration is allowed per person.');
            }
          }
          throw error;
        }

        // Refresh registration list
        await fetchRegistrations();
        setSubmitting(false);
        closeModal();
        showToast('Successfully registered for Limkokwing Fun Run!');
      } catch (err) {
        setFormError(err.message || 'An error occurred during registration. Please try again.');
        setSubmitting(false);
      }
    }
  };

  // Search Filtered registrations
  const filteredRegistrations = registrations.filter(reg => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      reg.full_name?.toLowerCase().includes(q) ||
      reg.bib_name?.toLowerCase().includes(q) ||
      reg.bib_number?.includes(q)
    );
  });

  // Dynamic statistics
  const totalRegistered = registrations.length;
  const competitiveCount = registrations.filter(r => r.compete === 'Yes').length;
  const funCount = registrations.filter(r => r.compete === 'No').length;

  return (
    <div className="relative min-h-screen pb-20">
      {/* Liquid animated backgrounds */}
      <div className="background-glow" />

      {/* Preview Mode Alert Banner */}
      {isMockMode && (
        <div className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 backdrop-blur-md border-b border-cyan-500/20 text-cyan-200 py-3 px-4 text-center text-sm flex items-center justify-center gap-2 z-50 sticky top-0">
          <Database className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>
            <strong>Preview Mode Active:</strong> Supabase environment variables are missing. Data is stored in your local browser storage.
          </span>
        </div>
      )}

      {/* Toast Notification */}
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

      {/* Navigation Header */}
      <nav className="glass-nav py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-gradient">
              LIMKOKWING
            </h1>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest -mt-1">
              Fun Run 3KM
            </p>
          </div>
        </div>

        <button 
          onClick={openModal}
          className="btn-primary pulse-glow"
          aria-label="Open registration form"
        >
          <UserPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Register BIB</span>
          <span className="sm:hidden">Register</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mt-10">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            <span>🔥 Limkokwing Campus Run 2026</span>
          </div>
          <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Claim Your <span className="text-gradient glow-text">BIB Number</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
            Choose your exclusive 4-digit code. Compete for major cash prizes or register for fun! Check the live list below to see what numbers are taken.
          </p>
        </section>

        {/* KPI Counter Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Registered</p>
              <h3 className="font-heading text-3xl font-bold text-white mt-1">{loading ? '...' : totalRegistered}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Competing for Prizes</p>
              <h3 className="font-heading text-3xl font-bold text-cyan-400 mt-1">{loading ? '...' : competitiveCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Running for Fun</p>
              <h3 className="font-heading text-3xl font-bold text-emerald-400 mt-1">{loading ? '...' : funCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smile className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Registration List & Search */}
        <section className="glass-panel p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">Registered Runners</h3>
              <p className="text-sm text-gray-400 mt-0.5">Live roster and taken BIB numbers</p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md w-full">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friend name or BIB number..."
                className="glass-input pl-10"
                aria-label="Search registered runners"
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

          {/* Table Area */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-xs font-semibold text-cyan-400 uppercase tracking-wider border-b border-white/5">
                  <th className="py-4 px-6 font-heading">BIB Number</th>
                  <th className="py-4 px-6">Name on BIB</th>
                  <th className="py-4 px-6">Full Name</th>
                  <th className="py-4 px-6">Class</th>
                  <th className="py-4 px-6">T-Shirt</th>
                  <th className="py-4 px-6">Prize Racer</th>
                  <th className="py-4 px-6 text-right">Register Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
                      Loading registrations...
                    </td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      {searchQuery ? 'No runners matching your search.' : 'No registrations yet. Be the first to register!'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <span className="inline-block font-heading font-bold text-base text-cyan-400 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 tracking-wider">
                          {reg.bib_number}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-white">{reg.bib_name}</td>
                      <td className="py-4 px-6 text-gray-300">{reg.full_name}</td>
                      <td className="py-4 px-6 text-gray-400">{reg.class_name}</td>
                      <td className="py-4 px-6 text-gray-400">{reg.t_shirt_size}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          reg.compete === 'Yes' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {reg.compete === 'Yes' ? 'Competitive' : 'Join for Fun'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-gray-500 text-xs">
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
      </main>

      {/* Footer Area */}
      <footer className="max-w-6xl mx-auto px-4 mt-16 text-center text-xs text-gray-500">
        <p>© 2026 Limkokwing University Fun Run. All rights reserved.</p>
        <p className="mt-1">Designed with a modern Liquid Glass Theme.</p>
      </footer>

      {/* Registration Modal Dialog */}
      <dialog 
        ref={modalRef} 
        onClick={handleBackdropClick}
        className="registration-modal"
        aria-modal="true"
      >
        {/* Modal Header */}
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
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Form Error Banner */}
          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-500/20 text-red-200 rounded-xl text-sm flex items-start gap-2 animate-shake">
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
              autocomplete="name"
            />
          </div>

          {/* BIB Name (Nickname) */}
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
            <p className="text-[11px] text-gray-500">This nickname will be printed directly on your physical runner BIB.</p>
          </div>

          {/* Phone Number */}
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
              autocomplete="tel"
            />
            {phoneWarning && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> {phoneWarning}
              </p>
            )}
            <p className="text-[11px] text-gray-500">Only 1 registration allowed per phone number.</p>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-300">
              Gender
            </span>
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

          {/* Class Dropdown */}
          <div className="space-y-2">
            <label htmlFor="class-select" className="block text-sm font-semibold text-gray-300">
              Class / Category
            </label>
            <select
              id="class-select"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="glass-input"
            >
              {['S2A', 'S2B', 'S2C', 'S2D', 'S2E', 'S2F', 'S2G', 'S2H', 'S2I', 'S2J', 'S1A', 'Degree'].map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Enter Race Competition */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-300">
              Would you like to compete for the prize?
            </span>
            <div className="custom-radio-group">
              <label className="custom-radio-card">
                <input
                  type="radio"
                  name="compete"
                  value="Yes"
                  checked={compete === 'Yes'}
                  onChange={() => setCompete('Yes')}
                />
                Yes (Compete)
              </label>
              <label className="custom-radio-card">
                <input
                  type="radio"
                  name="compete"
                  value="No"
                  checked={compete === 'No'}
                  onChange={() => setCompete('No')}
                />
                No (Run for Fun)
              </label>
            </div>
            <p className="text-[11px] text-gray-500">Choosing "No" registers you as a leisure runner, excluding you from physical winner awards.</p>
          </div>

          {/* T-Shirt Size */}
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-gray-300">
              T-Shirt Size
            </span>
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

          {/* BIB Number Selection */}
          <div className="space-y-2">
            <label htmlFor="bib-number" className="block text-sm font-semibold text-gray-300">
              Choose 4-Digit BIB Number
            </label>
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
            <p className="text-[11px] text-gray-500">
              You must enter exactly 4 digits. Prepend zeros if necessary (e.g. enter <strong>0001</strong> instead of 1, or <strong>0055</strong> instead of 55).
            </p>
          </div>

          {/* Telegram Channel Join */}
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

          {/* Health & Liability Waiver Checkbox */}
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

          {/* Modal Footer / Submit Panel */}
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
