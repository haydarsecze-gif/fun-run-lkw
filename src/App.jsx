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
  ArrowLeft,
  Edit2,
  Trash2
} from 'lucide-react';
import { supabase, isMockMode } from './supabaseClient';

const SIZE_LABELS = {
  'S': 'S (40-50kg)',
  'M': 'M (45-55kg)',
  'L': 'L (50-65kg)',
  'XL': 'XL (60-75kg)',
  'XXL': '2XL (70-85kg)',
  '3XL': '3XL (80-95kg)',
  '4XL': '4XL (90-105kg)'
};

const INSPIRING_SLOGANS = [
  "Run with passion, finish with pride. Every step brings you closer to your personal best!",
  "Your only limit is you. Lace up, step out, and let your journey begin.",
  "Unleash your potential, one stride at a time. The road to greatness is yours!",
  "Run for the fun, strive for the win, and celebrate the steps we take together!",
  "Every mile is a milestone. Ignite your energy and run your own race!",
  "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't."
];

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
  const [slogan, setSlogan] = useState('');

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

  // Edit Modal State
  const editModalRef = useRef(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editBibName, setEditBibName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editClassName, setEditClassName] = useState('S2A');
  const [editCompete, setEditCompete] = useState('Yes');
  const [editTShirtSize, setEditTShirtSize] = useState('M');
  const [editBibNumber, setEditBibNumber] = useState('');
  const [editBibWarning, setEditBibWarning] = useState('');
  const [editPhoneWarning, setEditPhoneWarning] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Warnings / Validation State
  const [bibWarning, setBibWarning] = useState('');
  const [phoneWarning, setPhoneWarning] = useState('');
  const [formError, setFormError] = useState('');

  const modalRef = useRef(null);

  // Route listener
  useEffect(() => {
    const checkPath = () => {
      setIsAdminRoute(window.location.pathname === '/admin');
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  // Set random inspiring slogan on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * INSPIRING_SLOGANS.length);
    setSlogan(INSPIRING_SLOGANS[randomIndex]);
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
    if (!bibNumber) return setFormError('BIB Number is required.');
    if (bibNumber.length !== 4) return setFormError('BIB Number must be exactly 4 digits.');
    if (!waiverAccepted) return setFormError('You must check "I agree and accept" to the Health & Liability Waiver.');
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
        const { error } = await supabase
          .from('registrations')
          .insert([newRecord]);

        if (error) {
          if (error.code === '23505') {
            const errStr = (error.message + ' ' + (error.details || '')).toLowerCase();
            if (errStr.includes('bib_number') || errStr.includes('bib')) {
              setBibWarning(`BIB number ${bibNumber} is already taken!`);
              throw new Error(`BIB number ${bibNumber} is already taken. Please choose another.`);
            }
            if (errStr.includes('phone_number') || errStr.includes('phone')) {
              setPhoneWarning('This phone number is already registered.');
              throw new Error('This phone number has already been registered. One entry per person.');
            }
          }
          throw error;
        }

        // Safely fetch generated ID & timestamp from public view to bypass RLS restrictions
        const { data: viewData } = await supabase
          .from('public_registrations')
          .select('id, created_at')
          .eq('bib_number', bibNumber)
          .maybeSingle();

        const insertedRecord = {
          id: viewData?.id || Math.random().toString(),
          created_at: viewData?.created_at || new Date().toISOString(),
          ...newRecord
        };

        // Prepend new registration to both views for instant UI updates
        setRegistrations(prev => [insertedRecord, ...prev]);
        setAdminData(prev => [insertedRecord, ...prev]);

        closeModal();
        showToast('Successfully registered!');
        setSubmitting(false);
        fetchPublicRegistrations();
      } catch (err) {
        setFormError(err.message || 'An error occurred during submission.');
        setSubmitting(false);
      }
    }
  };

  // Admin Delete Registration Action
  const handleDeleteClick = async (targetId, name, bibNum) => {
    if (!window.confirm(`Are you sure you want to delete registration for ${name} (BIB: ${bibNum})?`)) {
      return;
    }

    if (isMockMode) {
      const stored = JSON.parse(localStorage.getItem('funrun_registrations') || '[]');
      const updated = stored.filter(r => r.id !== targetId);
      localStorage.setItem('funrun_registrations', JSON.stringify(updated));
      setAdminData(updated);
      setRegistrations(updated);
      showToast('Deleted participant registration (Mock Mode)');
    } else {
      try {
        const { error } = await supabase
          .rpc('delete_registration_admin', { 
            admin_password: adminPassword, 
            target_id: targetId 
          });

        if (error) throw error;
        
        // Update state instantly
        setAdminData(prev => prev.filter(r => r.id !== targetId));
        setRegistrations(prev => prev.filter(r => r.id !== targetId));

        showToast('Successfully deleted registration!');
      } catch (err) {
        console.error('Error deleting:', err);
        showToast(err.message || 'Error deleting registration', 'error');
      }
    }
  };

  // Admin Edit Actions & Modal handlers
  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditFullName(record.full_name || '');
    setEditBibName(record.bib_name || '');
    setEditPhoneNumber(record.phone_number || '');
    setEditGender(record.gender || 'Male');
    setEditClassName(record.class_name || 'S2A');
    setEditCompete(record.compete || 'Yes');
    setEditTShirtSize(record.t_shirt_size || 'M');
    setEditBibNumber(record.bib_number || '');
    setEditBibWarning('');
    setEditPhoneWarning('');
    setEditFormError('');
    
    if (editModalRef.current) {
      editModalRef.current.showModal();
    }
  };

  const closeEditModal = () => {
    if (editModalRef.current) {
      editModalRef.current.close();
    }
    setEditingRecord(null);
  };

  const handleEditBackdropClick = (e) => {
    if (editModalRef.current && e.target === editModalRef.current) {
      closeEditModal();
    }
  };

  const handleEditBibChange = (val, id) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 4);
    setEditBibNumber(sanitized);
    setEditBibWarning('');

    if (sanitized.length === 4) {
      checkEditBibTaken(sanitized, id);
    }
  };

  const checkEditBibTaken = async (number, currentId) => {
    if (isMockMode) {
      const taken = adminData.some(r => r.bib_number === number && r.id !== currentId);
      if (taken) {
        setEditBibWarning(`BIB number ${number} is already taken!`);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('public_registrations')
          .select('id, bib_number')
          .eq('bib_number', number)
          .maybeSingle();

        if (error) throw error;
        if (data && data.id !== currentId) {
          setEditBibWarning(`BIB number ${number} is already taken!`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const checkEditPhoneDuplicate = async (phone, id) => {
    if (!phone) return;
    setEditPhoneWarning('');

    if (isMockMode) {
      const taken = adminData.some(r => r.phone_number === phone && r.id !== id);
      if (taken) {
        setEditPhoneWarning('This phone number is already registered!');
      }
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');

    if (!editFullName.trim()) return setEditFormError('Full Name is required.');
    if (!editBibName.trim()) return setEditFormError('BIB Name is required.');
    if (!editPhoneNumber.trim()) return setEditFormError('Phone Number is required.');
    if (editBibNumber.length !== 4) return setEditFormError('BIB Number must be exactly 4 digits.');
    if (editBibWarning) return setEditFormError('BIB number is already taken.');
    if (editPhoneWarning) return setEditFormError('Phone number is already registered.');

    setEditSubmitting(true);

    const updatedRecord = {
      full_name: editFullName.trim(),
      bib_name: editBibName.trim(),
      phone_number: editPhoneNumber.trim(),
      gender: editGender,
      class_name: editClassName,
      compete: editCompete,
      t_shirt_size: editTShirtSize,
      bib_number: editBibNumber
    };

    if (isMockMode) {
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('funrun_registrations') || '[]');
        
        const bibTaken = stored.some(r => r.bib_number === editBibNumber && r.id !== editingRecord.id);
        const phoneTaken = stored.some(r => r.phone_number === editPhoneNumber.trim() && r.id !== editingRecord.id);

        if (bibTaken) {
          setEditBibWarning(`BIB number ${editBibNumber} is already taken!`);
          setEditFormError('Update failed: BIB number already taken.');
          setEditSubmitting(false);
          return;
        }

        if (phoneTaken) {
          setEditPhoneWarning('Phone number already registered!');
          setEditFormError('Update failed: Phone number already registered.');
          setEditSubmitting(false);
          return;
        }

        const updated = stored.map(r => r.id === editingRecord.id ? { ...r, ...updatedRecord } : r);
        localStorage.setItem('funrun_registrations', JSON.stringify(updated));
        
        setAdminData(updated);
        setRegistrations(updated);
        setEditSubmitting(false);
        closeEditModal();
        showToast('Successfully updated participant registration (Mock Mode)!');
      }, 500);
    } else {
      try {
        const { error } = await supabase
          .rpc('update_registration_admin', {
            admin_password: adminPassword,
            target_id: editingRecord.id,
            new_full_name: editFullName.trim(),
            new_bib_name: editBibName.trim(),
            new_phone_number: editPhoneNumber.trim(),
            new_gender: editGender,
            new_class_name: editClassName,
            new_compete: editCompete,
            new_t_shirt_size: editTShirtSize,
            new_bib_number: editBibNumber
          });

        if (error) {
          if (error.code === '23505') {
            const errStr = (error.message + ' ' + (error.details || '')).toLowerCase();
            if (errStr.includes('bib_number') || errStr.includes('bib')) {
              setEditBibWarning(`BIB number ${editBibNumber} is already taken!`);
              throw new Error(`BIB number ${editBibNumber} is already taken. Please choose another.`);
            }
            if (errStr.includes('phone_number') || errStr.includes('phone')) {
              setEditPhoneWarning('This phone number is already registered.');
              throw new Error('This phone number has already been registered. One entry per person.');
            }
          }
          throw error;
        }

        const updatedRecord = {
          id: editingRecord.id,
          created_at: editingRecord.created_at,
          full_name: editFullName.trim(),
          bib_name: editBibName.trim(),
          phone_number: editPhoneNumber.trim(),
          gender: editGender,
          class_name: editClassName,
          compete: editCompete,
          t_shirt_size: editTShirtSize,
          bib_number: editBibNumber
        };

        // Update local state instantly
        setAdminData(prev => prev.map(r => r.id === editingRecord.id ? updatedRecord : r));
        setRegistrations(prev => prev.map(r => r.id === editingRecord.id ? updatedRecord : r));

        closeEditModal();
        showToast('Successfully updated registration!');
        setEditSubmitting(false);

        // Keep background sync to guarantee state
        supabase
          .rpc('get_all_registrations', { admin_password: adminPassword })
          .then(({ data: refreshed, error: refreshErr }) => {
            if (!refreshErr && refreshed) {
              setAdminData(refreshed);
            }
          })
          .catch(err => console.error('Background refresh error:', err));
      } catch (err) {
        setEditFormError(err.message || 'An error occurred during update.');
        setEditSubmitting(false);
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
        {/* Navigation bar */}
        <nav className="glass-nav">
          <div className="nav-container">
            <div className="cursor-pointer" style={{ display: 'flex', alignItems: 'center' }} onClick={() => navigateTo('/')}>
              <div>
                <h1 className="font-heading text-gradient glow-text" style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                  LIMKOKWING
                </h1>
                <p className="font-heading" style={{ fontSize: '0.7rem', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '-2px' }}>
                  Siem Reap Fun Run
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isAdminRoute ? (
                <button 
                  onClick={() => navigateTo('/')}
                  className="btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="nav-btn-text">Back to Home</span>
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => navigateTo('/admin')}
                    className="btn-secondary"
                  >
                    <Lock className="w-4 h-4 text-cyan-400" />
                    <span className="nav-btn-text">Admin Panel</span>
                  </button>
                  <button 
                    onClick={openModal}
                    className="btn-primary pulse-glow"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="nav-btn-text">Register</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main layout container */}
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
                    <p>Manage, search, edit, and delete participant records</p>
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
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
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
                            <td style={{ color: '#64748b' }}>
                              {new Date(reg.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleEditClick(reg)}
                                  className="btn-secondary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '8px', gap: '0.2rem' }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(reg.id, reg.full_name, reg.bib_number)}
                                  className="btn-secondary"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderRadius: '8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', gap: '0.2rem' }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
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
              <h2 className="hero-title">
                3KM Fun Run <span className="text-gradient glow-text">Registration</span>
              </h2>
              <p className="hero-desc">
                {slogan}
              </p>
            </section>

            {/* Centered Hero Register Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem', padding: '0 1.25rem', width: '100%' }}>
              <button 
                onClick={openModal}
                className="btn-primary pulse-glow"
                style={{ width: '100%', maxWidth: '620px', padding: '1rem 2.5rem', fontSize: '1.05rem', borderRadius: '16px', gap: '0.65rem' }}
              >
                <UserPlus className="w-5 h-5" />
                <span>Register</span>
              </button>
            </div>

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

            {/* Hero Graphic Banner Container */}
            <section className="glass-panel banner-panel">
              <img 
                src="/hero-banner.jpg" 
                alt="Limkokwing Siem Reap Fun Run Runners" 
                className="banner-image"
              />
            </section>

          </main>
        )}
      </div>

      {/* Footer Area with Sora credit badge */}
      <footer className="footer-container">
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <p>© 2026 Limkokwing University. All rights reserved.</p>
          <p style={{ marginTop: '0.25rem' }}>Designed with a modern Liquid Glass Theme.</p>
        </div>

        {/* Credit Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/25 text-[10px] text-cyan-400 font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/5" style={{ display: 'inline-flex', padding: '0.4rem 1rem', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '999px', fontSize: '0.65rem', color: '#00f0ff', letterSpacing: '1px', textTransform: 'uppercase' }}>
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
        {submitting && (
          <div className="modal-loading-overlay">
            <div className="loader-container">
              <div className="loader-animation-wrapper">
                <div className="loader-ring"></div>
                <Activity className="loader-icon" />
              </div>
              <h4 className="loader-title">Registering Runner</h4>
              <p className="loader-text">Securing your BIB number & saving details...</p>
            </div>
          </div>
        )}
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
              placeholder="e.g. Johnathan Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* BIB Name */}
          <div className="form-group">
            <label htmlFor="bib-name" className="form-label">Name on the Bib (Nickname)</label>
            <input
              type="text"
              id="bib-name"
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
              <input
                type="radio"
                id="gender-male"
                name="gender"
                value="Male"
                checked={gender === 'Male'}
                onChange={() => setGender('Male')}
                className="hidden-radio"
              />
              <label htmlFor="gender-male" className="custom-radio-card">
                Male
              </label>

              <input
                type="radio"
                id="gender-female"
                name="gender"
                value="Female"
                checked={gender === 'Female'}
                onChange={() => setGender('Female')}
                className="hidden-radio"
              />
              <label htmlFor="gender-female" className="custom-radio-card">
                Female
              </label>
            </div>
          </div>

          {/* Class */}
          <div className="form-group">
            <label htmlFor="class-select" className="form-label">Class</label>
            <select
              id="class-select"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="glass-input"
            >
              {['S2A', 'S2B', 'S2C', 'S2D', 'S2E', 'S2F', 'S2G', 'S2H', 'S2I', 'S2J', 'S1A', 'Degree', 'Other'].map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">{cls}</option>
              ))}
            </select>
          </div>

          {/* Compete */}
          <div className="form-group">
            <span className="form-label">Would you like to compete for the prize?</span>
            <div className="custom-radio-group">
              <input
                type="radio"
                id="compete-yes"
                name="compete"
                value="Yes"
                checked={compete === 'Yes'}
                onChange={() => setCompete('Yes')}
                className="hidden-radio"
              />
              <label htmlFor="compete-yes" className="custom-radio-card">
                Yes
              </label>

              <input
                type="radio"
                id="compete-no"
                name="compete"
                value="No"
                checked={compete === 'No'}
                onChange={() => setCompete('No')}
                className="hidden-radio"
              />
              <label htmlFor="compete-no" className="custom-radio-card">
                No (Join for Fun)
              </label>
            </div>
          </div>

          {/* T-Shirt */}
          <div className="form-group">
            <span className="form-label">T-Shirt Size</span>
            <div className="t-shirt-grid">
              {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(size => (
                <React.Fragment key={size}>
                  <input
                    type="radio"
                    id={`size-${size}`}
                    name="t-shirt-size"
                    value={size}
                    checked={tShirtSize === size}
                    onChange={() => setTShirtSize(size)}
                    className="hidden-radio"
                  />
                  <label htmlFor={`size-${size}`} className="custom-radio-card">
                    {SIZE_LABELS[size]}
                  </label>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* BIB Number */}
          <div className="form-group">
            <label htmlFor="bib-number" className="form-label">Choose 4-Digit BIB Number</label>
            <input
              type="text"
              id="bib-number"
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
              "I confirm that I am physically fit to participate in the run and accept full responsibility for my own safety during the event."
            </div>
            
            <label className="checkbox-container" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
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
              disabled={submitting || !fullName.trim() || !bibName.trim() || !phoneNumber.trim() || bibNumber.length !== 4 || !waiverAccepted || !!bibWarning || !!phoneWarning}
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

      {/* Admin Edit Modal Dialog */}
      <dialog 
        ref={editModalRef} 
        onClick={handleEditBackdropClick}
        className="registration-modal"
        aria-modal="true"
      >
        {editSubmitting && (
          <div className="modal-loading-overlay">
            <div className="loader-container">
              <div className="loader-animation-wrapper">
                <div className="loader-ring"></div>
                <Activity className="loader-icon" />
              </div>
              <h4 className="loader-title">Updating Database</h4>
              <p className="loader-text">Saving runner modifications...</p>
            </div>
          </div>
        )}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>
              <Edit2 className="w-5 h-5 text-cyan-400" />
              Adjust Runner Information
            </h3>
            <p>Update database details for this participant</p>
          </div>
          <button 
            type="button"
            onClick={closeEditModal}
            className="clear-search-btn"
            style={{ position: 'static', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdateSubmit} className="modal-body-form">
          {editFormError && (
            <div className="form-warning" style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{editFormError}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="edit-full-name" className="form-label">Full Name</label>
            <input
              type="text"
              id="edit-full-name"
              placeholder="e.g. Johnathan Doe"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* BIB Name */}
          <div className="form-group">
            <label htmlFor="edit-bib-name" className="form-label">Name on the Bib (Nickname)</label>
            <input
              type="text"
              id="edit-bib-name"
              maxLength="15"
              placeholder="e.g. Johnny (Max 15 chars)"
              value={editBibName}
              onChange={(e) => setEditBibName(e.target.value)}
              className="glass-input"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="edit-phone-number" className="form-label">Phone Number</label>
            <input
              type="tel"
              id="edit-phone-number"
              placeholder="e.g. +60123456789"
              value={editPhoneNumber}
              onBlur={() => checkEditPhoneDuplicate(editPhoneNumber, editingRecord?.id)}
              onChange={(e) => {
                setEditPhoneNumber(e.target.value);
                setEditPhoneWarning('');
              }}
              className="glass-input"
            />
            {editPhoneWarning && (
              <p className="form-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> {editPhoneWarning}
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="form-group">
            <span className="form-label">Gender</span>
            <div className="custom-radio-group">
              <input
                type="radio"
                id="edit-gender-male"
                name="edit-gender"
                value="Male"
                checked={editGender === 'Male'}
                onChange={() => setEditGender('Male')}
                className="hidden-radio"
              />
              <label htmlFor="edit-gender-male" className="custom-radio-card">
                Male
              </label>

              <input
                type="radio"
                id="edit-gender-female"
                name="edit-gender"
                value="Female"
                checked={editGender === 'Female'}
                onChange={() => setEditGender('Female')}
                className="hidden-radio"
              />
              <label htmlFor="edit-gender-female" className="custom-radio-card">
                Female
              </label>
            </div>
          </div>

          {/* Class */}
          <div className="form-group">
            <label htmlFor="edit-class-select" className="form-label">Class</label>
            <select
              id="edit-class-select"
              value={editClassName}
              onChange={(e) => setEditClassName(e.target.value)}
              className="glass-input"
            >
              {['S2A', 'S2B', 'S2C', 'S2D', 'S2E', 'S2F', 'S2G', 'S2H', 'S2I', 'S2J', 'S1A', 'Degree', 'Other'].map(cls => (
                <option key={cls} value={cls} className="bg-slate-900 text-white">{cls}</option>
              ))}
            </select>
          </div>

          {/* Compete */}
          <div className="form-group">
            <span className="form-label">Would you like to compete for the prize?</span>
            <div className="custom-radio-group">
              <input
                type="radio"
                id="edit-compete-yes"
                name="edit-compete"
                value="Yes"
                checked={editCompete === 'Yes'}
                onChange={() => setEditCompete('Yes')}
                className="hidden-radio"
              />
              <label htmlFor="edit-compete-yes" className="custom-radio-card">
                Yes
              </label>

              <input
                type="radio"
                id="edit-compete-no"
                name="edit-compete"
                value="No"
                checked={editCompete === 'No'}
                onChange={() => setEditCompete('No')}
                className="hidden-radio"
              />
              <label htmlFor="edit-compete-no" className="custom-radio-card">
                No (Join for Fun)
              </label>
            </div>
          </div>

          {/* T-Shirt */}
          <div className="form-group">
            <span className="form-label">T-Shirt Size</span>
            <div className="t-shirt-grid">
              {['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].map(size => (
                <React.Fragment key={size}>
                  <input
                    type="radio"
                    id={`edit-size-${size}`}
                    name="edit-t-shirt-size"
                    value={size}
                    checked={editTShirtSize === size}
                    onChange={() => setEditTShirtSize(size)}
                    className="hidden-radio"
                  />
                  <label htmlFor={`edit-size-${size}`} className="custom-radio-card">
                    {SIZE_LABELS[size]}
                  </label>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* BIB Number */}
          <div className="form-group">
            <label htmlFor="edit-bib-number" className="form-label">Choose 4-Digit BIB Number</label>
            <input
              type="text"
              id="edit-bib-number"
              inputmode="numeric"
              placeholder="e.g. 0007"
              value={editBibNumber}
              onChange={(e) => handleEditBibChange(e.target.value, editingRecord?.id)}
              className="glass-input tracking-widest font-heading"
              style={{ fontWeight: 700, fontSize: '1.25rem', textAlign: 'center' }}
            />
            {editBibWarning ? (
              <p className="form-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> {editBibWarning}
              </p>
            ) : editBibNumber.length === 4 ? (
              <p className="form-success">
                <Check className="w-3.5 h-3.5" /> BIB Number {editBibNumber} is available!
              </p>
            ) : null}
            <p className="form-hint">Must be exactly 4 digits. (e.g. 0001, 0023, 9999).</p>
          </div>

          {/* Footer Submit */}
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={closeEditModal}
              className="btn-secondary"
              disabled={editSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={editSubmitting || !editFullName.trim() || !editBibName.trim() || !editPhoneNumber.trim() || editBibNumber.length !== 4 || !!editBibWarning || !!editPhoneWarning}
            >
              {editSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

        </form>
      </dialog>
    </div>
  );
}

export default App;
