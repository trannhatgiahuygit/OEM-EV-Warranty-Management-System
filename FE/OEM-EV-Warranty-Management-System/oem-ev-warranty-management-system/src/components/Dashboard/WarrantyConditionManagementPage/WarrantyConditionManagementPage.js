import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaSearch, FaFileContract, FaHashtag, FaCalendarAlt, FaRoad, FaAlignLeft, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaCar } from 'react-icons/fa';
import './WarrantyConditionManagementPage.css';

// Component to display the list of warranty conditions
const WarrantyConditionsTable = ({ conditions, loading, onEdit, onDelete, canEdit, searchQuery, onSearchChange }) => {
    if (loading) {
        return <div className="warranty-condition-message">Đang tải điều kiện bảo hành...</div>;
    }

    // Filter conditions by vehicle model name or ID
    const filteredConditions = conditions.filter(condition => {
        if (!searchQuery || !searchQuery.trim()) {
            return true;
        }
        const query = searchQuery.toLowerCase().trim();
        // Search by vehicle model name if available
        const modelName = condition.vehicleModelName ? condition.vehicleModelName.toLowerCase() : '';
        // Search by vehicle model ID as fallback
        const modelId = condition.vehicleModelId ? condition.vehicleModelId.toString() : '';
        // Match if query is found in either name or ID
        return modelName.includes(query) || modelId.includes(query);
    });

    if (filteredConditions.length === 0 && conditions.length > 0) {
        return (
            <div>
                <div className="warranty-condition-message">Không tìm thấy điều kiện bảo hành nào phù hợp với tìm kiếm "{searchQuery}".</div>
            </div>
        );
    }

    if (conditions.length === 0) {
        return <div className="warranty-condition-message">Không tìm thấy điều kiện bảo hành nào.</div>;
    }

    return (
        <motion.div
            className="warranty-condition-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Search Input */}
            {onSearchChange && (
                <div className="warranty-condition-search-container">
                    <div className="warranty-condition-search-input-wrapper">
                        <FaSearch className="warranty-condition-search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên mẫu xe..."
                            value={searchQuery || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="warranty-condition-search-input"
                        />
                    </div>
                    {searchQuery && (
                        <div className="warranty-condition-search-results-info">
                            Hiển thị {filteredConditions.length} / {conditions.length} điều kiện
                        </div>
                    )}
                </div>
            )}

            <div className="warranty-condition-table-wrapper">
                <table className="warranty-condition-list-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mã Mẫu Xe</th>
                            <th>Tên Mẫu Xe</th>
                            <th>Thời hạn (năm)</th>
                            <th>Quãng đường (km)</th>
                            <th>Hiệu lực từ</th>
                            <th>Hiệu lực đến</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConditions.map((condition) => (
                            <tr key={condition.id}>
                                <td>{condition.id}</td>
                                <td>{condition.vehicleModelId || 'N/A'}</td>
                                <td>{condition.vehicleModelName || 'N/A'}</td>
                                <td>{condition.coverageYears || 'N/A'}</td>
                                <td>{condition.coverageKm ? `${condition.coverageKm.toLocaleString('vi-VN')} km` : 'N/A'}</td>
                                <td>{condition.effectiveFrom ? new Date(condition.effectiveFrom).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>{condition.effectiveTo ? new Date(condition.effectiveTo).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>
                                    <span className={`warranty-condition-status ${condition.active ? 'active' : 'inactive'}`}>
                                        {condition.active ? 'Hoạt động' : 'Không hoạt động'}
                                    </span>
                                </td>
                                <td>
                                    {canEdit ? (
                                        <div className="warranty-condition-action-buttons">
                                            <button
                                                onClick={() => onEdit(condition)}
                                                className="warranty-condition-edit-button"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => onDelete(condition.id)}
                                                className="warranty-condition-delete-button"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="warranty-condition-view-only">Chỉ xem</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

// Vehicle Model Search Component
const VehicleModelSearch = ({ value, onChange, disabled, placeholder }) => {
    const [vehicleModels, setVehicleModels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const resultsRef = useRef(null);

    // Fetch vehicle models on mount
    useEffect(() => {
        const fetchVehicleModels = async () => {
            setLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user?.token;
                if (!token) return;

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/vehicle-models/active`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (response.status === 200) {
                    setVehicleModels(response.data || []);
                }
            } catch (err) {
                console.error('Error fetching vehicle models:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicleModels();
    }, []);

    // Find selected model by ID
    useEffect(() => {
        if (value && vehicleModels.length > 0) {
            const model = vehicleModels.find(m => m.id === parseInt(value, 10));
            if (model) {
                setSelectedModel(model);
                // Display: "Model Name (Code: XXX)" or just "Model Name" if no code
                const displayText = model.code 
                    ? `${model.name || 'N/A'} (Mã: ${model.code})`
                    : (model.name || 'N/A');
                setSearchQuery(displayText);
            } else {
                setSelectedModel(null);
                setSearchQuery('');
            }
        } else {
            setSelectedModel(null);
            setSearchQuery('');
        }
    }, [value, vehicleModels]);

    // Filter models based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            // Show first 20 models when no search query (for browsing)
            setSearchResults(vehicleModels.slice(0, 20));
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = vehicleModels.filter(model => 
            (model.name && model.name.toLowerCase().includes(query)) ||
            (model.code && model.code.toLowerCase().includes(query)) ||
            (model.brand && model.brand.toLowerCase().includes(query)) ||
            (model.id && model.id.toString().includes(query))
        );
        setSearchResults(filtered);
    }, [searchQuery, vehicleModels]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current && 
                !searchRef.current.contains(event.target) &&
                resultsRef.current &&
                !resultsRef.current.contains(event.target)
            ) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setShowResults(true);
        
        // Clear selection if user is typing something different from the selected model display
        if (selectedModel) {
            const selectedDisplayText = selectedModel.code 
                ? `${selectedModel.name || 'N/A'} (Mã: ${selectedModel.code})`
                : (selectedModel.name || 'N/A');
            if (query !== selectedDisplayText) {
                setSelectedModel(null);
                onChange('');
            }
        }
    };

    const handleSelectModel = (model) => {
        setSelectedModel(model);
        // Display: "Model Name (Code: XXX)" or just "Model Name" if no code
        const displayText = model.code 
            ? `${model.name || 'N/A'} (Mã: ${model.code})`
            : (model.name || 'N/A');
        setSearchQuery(displayText);
        setShowResults(false);
        onChange(model.id.toString());
    };

    const handleClear = () => {
        setSearchQuery('');
        setSelectedModel(null);
        setShowResults(false);
        onChange('');
    };

    return (
        <div className="warranty-condition-model-search-container" ref={searchRef}>
            <div className="warranty-condition-model-search-input-wrapper">
                <FaCar className="warranty-condition-model-search-icon" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => {
                        setShowResults(true);
                    }}
                    disabled={disabled}
                    className="warranty-condition-model-search-input"
                    placeholder={placeholder || "Tìm kiếm theo tên hoặc mã mẫu xe..."}
                />
                {selectedModel && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="warranty-condition-model-search-clear"
                        aria-label="Clear selection"
                    >
                        ×
                    </button>
                )}
            </div>
            {showResults && searchResults.length > 0 && (
                <div className="warranty-condition-model-search-results" ref={resultsRef}>
                    {searchQuery.trim() && (
                        <div className="warranty-condition-model-search-result-header">
                            Tìm thấy {searchResults.length} mẫu xe
                        </div>
                    )}
                    {searchResults.map((model) => (
                        <div
                            key={model.id}
                            onClick={() => handleSelectModel(model)}
                            className={`warranty-condition-model-search-result-item ${selectedModel && selectedModel.id === model.id ? 'selected' : ''}`}
                        >
                            <div className="warranty-condition-model-search-result-name">
                                {model.name || 'N/A'}
                                {model.code && (
                                    <span className="warranty-condition-model-search-result-code">
                                        {' '}(Mã: {model.code})
                                    </span>
                                )}
                            </div>
                            <div className="warranty-condition-model-search-result-meta">
                                {model.brand && <span>Thương hiệu: {model.brand}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {showResults && searchQuery.trim() && searchResults.length === 0 && !loading && (
                <div className="warranty-condition-model-search-results" ref={resultsRef}>
                    <div className="warranty-condition-model-search-result-item warranty-condition-model-search-no-results">
                        Không tìm thấy mẫu xe nào
                    </div>
                </div>
            )}
        </div>
    );
};

// DatePicker Component with Calendar Dropdown
const DatePicker = ({ value, onChange, onBlur, placeholder, disabled, minDate = '1900-01-01' }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const calendarRef = useRef(null);
    const inputRef = useRef(null);
    
    // Parse minDate
    const minDateObj = new Date(minDate);
    const minYear = minDateObj.getFullYear();
    const minMonth = minDateObj.getMonth();
    const minDay = minDateObj.getDate();
    
    // Initialize display value
    useEffect(() => {
        if (value) {
            // Convert YYYY-MM-DD to DD/MM/YYYY
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [year, month, day] = value.split('-');
                setDisplayValue(`${day}/${month}/${year}`);
            } else {
                setDisplayValue(value);
            }
        } else {
            setDisplayValue('');
        }
    }, [value]);
    
    // Set current month to selected date or today
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }
        }
    }, [value]);
    
    // Handle click outside to close calendar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(event.target) &&
                inputRef.current &&
                !inputRef.current.contains(event.target)
            ) {
                setShowCalendar(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Format date input
    const formatDateInput = (val) => {
        const numbers = val.replace(/\D/g, '');
        if (!numbers) return '';
        
        if (numbers.length === 1) return numbers;
        if (numbers.length === 2) return numbers;
        if (numbers.length === 3) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
        if (numbers.length === 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
        if (numbers.length === 5) return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
        if (numbers.length === 6) return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
        if (numbers.length === 7) return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
        if (numbers.length >= 8) return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
        return numbers;
    };
    
    // Convert to YYYY-MM-DD
    const formatDateForInput = (val) => {
        if (!val) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        
        const numbers = val.replace(/\D/g, '');
        if (numbers.length < 6) return '';
        
        let day, month, year;
        if (numbers.length === 6) {
            day = numbers.slice(0, 2);
            month = numbers.slice(2, 4);
            const twoDigitYear = numbers.slice(4);
            year = parseInt(twoDigitYear) <= 50 ? `20${twoDigitYear}` : `19${twoDigitYear}`;
        } else if (numbers.length >= 8) {
            day = numbers.slice(0, 2);
            month = numbers.slice(2, 4);
            year = numbers.slice(4, 8);
        } else {
            return '';
        }
        
        if (parseInt(day) < 1 || parseInt(day) > 31) return '';
        if (parseInt(month) < 1 || parseInt(month) > 12) return '';
        if (parseInt(year) < minYear || parseInt(year) > 2100) return '';
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime()) || 
            date.getDate() !== parseInt(day) || 
            date.getMonth() !== parseInt(month) - 1 || 
            date.getFullYear() !== parseInt(year)) {
            return '';
        }
        
        // Check if date is before minDate
        if (date < minDateObj) return '';
        
        return `${year}-${month}-${day}`;
    };
    
    // Handle input change
    const handleInputChange = (e) => {
        const val = e.target.value;
        const formatted = formatDateInput(val);
        setDisplayValue(formatted);
        
        const numbers = val.replace(/\D/g, '');
        if (numbers.length === 8) {
            const dateForInput = formatDateForInput(formatted);
            if (dateForInput) {
                onChange(dateForInput);
            }
        }
    };
    
    // Handle input blur
    const handleInputBlur = (e) => {
        const numbers = e.target.value.replace(/\D/g, '');
        if (numbers.length === 6 || numbers.length === 8) {
            const dateForInput = formatDateForInput(e.target.value);
            if (dateForInput) {
                onChange(dateForInput);
                const [year, month, day] = dateForInput.split('-');
                setDisplayValue(`${day}/${month}/${year}`);
            } else if (e.target.value.trim()) {
                setDisplayValue('');
                onChange('');
                toast.error('Ngày tháng không hợp lệ hoặc trước 01/01/1900');
            }
        }
        if (onBlur) onBlur(e);
    };
    
    // Get calendar days
    const getCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            days.push(date);
        }
        
        return days;
    };
    
    // Check if date is disabled (before minDate)
    const isDateDisabled = (date) => {
        if (!date) return true;
        return date < minDateObj;
    };
    
    // Check if date is selected
    const isDateSelected = (date) => {
        if (!value || !date) return false;
        const selectedDate = new Date(value);
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear();
    };
    
    // Handle date selection
    const handleDateSelect = (date) => {
        if (isDateDisabled(date)) return;
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        onChange(dateStr);
        setDisplayValue(`${day}/${month}/${year}`);
        setShowCalendar(false);
    };
    
    // Navigate months
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    
    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    
    // Get month name in Vietnamese
    const getMonthName = (date) => {
        const months = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return months[date.getMonth()];
    };
    
    // Get day names in Vietnamese
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    const calendarDays = getCalendarDays();
    
    return (
        <div className="warranty-condition-date-picker-container">
            <div className="warranty-condition-date-picker-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onFocus={() => setShowCalendar(true)}
                    disabled={disabled}
                    className="warranty-condition-date-picker-input"
                    placeholder={placeholder || "Nhập DD/MM/YYYY (ví dụ: 01012025)"}
                />
                <FaCalendarAlt
                    className="warranty-condition-date-picker-icon"
                    onClick={() => !disabled && setShowCalendar(!showCalendar)}
                />
            </div>
            {showCalendar && !disabled && (
                <div className="warranty-condition-date-picker-calendar" ref={calendarRef}>
                    <div className="warranty-condition-date-picker-calendar-header">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="warranty-condition-date-picker-nav-button"
                        >
                            ‹
                        </button>
                        <div className="warranty-condition-date-picker-month-year">
                            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                        </div>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="warranty-condition-date-picker-nav-button"
                        >
                            ›
                        </button>
                    </div>
                    <div className="warranty-condition-date-picker-calendar-days-header">
                        {dayNames.map((day, index) => (
                            <div key={index} className="warranty-condition-date-picker-day-name">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="warranty-condition-date-picker-calendar-days">
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return <div key={index} className="warranty-condition-date-picker-day empty"></div>;
                            }
                            
                            const isDisabled = isDateDisabled(date);
                            const isSelected = isDateSelected(date);
                            
                            return (
                                <div
                                    key={index}
                                    className={`warranty-condition-date-picker-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => !isDisabled && handleDateSelect(date)}
                                >
                                    {date.getDate()}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function to format date input (display only, no auto-conversion)
const formatDateInput = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Handle different formats - only add slashes progressively, don't convert year
    if (numbers.length === 1) {
        // Just first digit: "1"
        return numbers;
    } else if (numbers.length === 2) {
        // Day: "01"
        return numbers;
    } else if (numbers.length === 3) {
        // Day and start of month: "011" -> "01/1"
        return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else if (numbers.length === 4) {
        // Day and month: "0101" -> "01/01"
        return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else if (numbers.length === 5) {
        // Day, month, and start of year: "01011" -> "01/01/1"
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else if (numbers.length === 6) {
        // Day, month, and 2-digit year: "010125" -> "01/01/25" (keep 2-digit year as is, no conversion)
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else if (numbers.length === 7) {
        // Day, month, and start of 4-digit year: "0101202" -> "01/01/202"
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else if (numbers.length >= 8) {
        // Day, month, and 4-digit year: "01012025" -> "01/01/2025"
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
    
    return numbers;
};

// Helper function to convert formatted date (DD/MM/YYYY) to YYYY-MM-DD for backend
const formatDateForInput = (value) => {
    if (!value) return '';
    
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }
    
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length < 6) return '';
    
    let day, month, year;
    
    if (numbers.length === 6) {
        // "010125" -> DD: 01, MM: 01, YY: 25 -> year: 2025
        day = numbers.slice(0, 2);
        month = numbers.slice(2, 4);
        const twoDigitYear = numbers.slice(4);
        year = parseInt(twoDigitYear) <= 50 ? `20${twoDigitYear}` : `19${twoDigitYear}`;
    } else if (numbers.length >= 8) {
        // "01012025" -> DD: 01, MM: 01, YYYY: 2025
        day = numbers.slice(0, 2);
        month = numbers.slice(2, 4);
        year = numbers.slice(4, 8);
    } else {
        return '';
    }
    
    // Validate date (day, month, year)
    if (parseInt(day) < 1 || parseInt(day) > 31) return '';
    if (parseInt(month) < 1 || parseInt(month) > 12) return '';
    if (parseInt(year) < 1900 || parseInt(year) > 2100) return '';
    
    // Create date object to validate
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isNaN(date.getTime()) || 
        date.getDate() !== parseInt(day) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getFullYear() !== parseInt(year)) {
        return '';
    }
    
    // Return in YYYY-MM-DD format (ISO format for backend)
    return `${year}-${month}-${day}`;
};

// Component for creating/editing a warranty condition
const WarrantyConditionForm = ({ 
    condition, 
    vehicleModelId, 
    onSave, 
    onCancel, 
    loading
}) => {
    const [formData, setFormData] = useState({
        vehicleModelId: vehicleModelId || '',
        coverageYears: '',
        coverageKm: '',
        conditionsText: '',
        effectiveFrom: '',
        effectiveTo: '',
        lifetimeWarranty: false, // Bảo hành trọn đời (không có thời hạn)
        active: true
    });
    
    const [isManualEffectiveTo, setIsManualEffectiveTo] = useState(false); // Track if user manually set effectiveTo

    useEffect(() => {
        if (condition) {
            const effectiveFromDate = condition.effectiveFrom ? condition.effectiveFrom.split('T')[0] : '';
            const effectiveToDate = condition.effectiveTo ? condition.effectiveTo.split('T')[0] : '';
            // Check if lifetime warranty (effectiveTo is null or empty)
            const isLifetime = !effectiveToDate || effectiveToDate === '';
            
            setFormData({
                vehicleModelId: condition.vehicleModelId || vehicleModelId || '',
                coverageYears: condition.coverageYears || '',
                coverageKm: condition.coverageKm || '',
                conditionsText: condition.conditionsText || '',
                effectiveFrom: effectiveFromDate,
                effectiveTo: effectiveToDate,
                lifetimeWarranty: isLifetime,
                active: condition.active !== undefined ? condition.active : true
            });
            setIsManualEffectiveTo(false); // Reset when loading from condition
        } else {
            setFormData({
                vehicleModelId: vehicleModelId || '',
                coverageYears: '',
                coverageKm: '',
                conditionsText: '',
                effectiveFrom: '',
                effectiveTo: '',
                lifetimeWarranty: false,
                active: true
            });
            setIsManualEffectiveTo(false);
        }
    }, [condition, vehicleModelId]);
    
    // Calculate effectiveTo from effectiveFrom + coverageYears (only if not lifetime warranty)
    useEffect(() => {
        // Don't calculate if lifetime warranty is enabled
        if (formData.lifetimeWarranty) {
            setFormData(prev => ({ ...prev, effectiveTo: '' }));
            return;
        }
        
        if (formData.effectiveFrom && formData.coverageYears && !isManualEffectiveTo) {
            const fromDate = new Date(formData.effectiveFrom);
            if (!isNaN(fromDate.getTime())) {
                const years = parseFloat(formData.coverageYears);
                if (!isNaN(years) && years > 0) {
                    const toDate = new Date(fromDate);
                    // Add years (handle integer years)
                    const wholeYears = Math.floor(years);
                    const months = Math.round((years - wholeYears) * 12);
                    toDate.setFullYear(fromDate.getFullYear() + wholeYears);
                    if (months > 0) {
                        toDate.setMonth(fromDate.getMonth() + months);
                    }
                    
                    // Format to YYYY-MM-DD
                    const year = toDate.getFullYear();
                    const month = String(toDate.getMonth() + 1).padStart(2, '0');
                    const day = String(toDate.getDate()).padStart(2, '0');
                    const calculatedToDate = `${year}-${month}-${day}`;
                    
                    // Only update if different to avoid infinite loop
                    setFormData(prev => {
                        if (prev.effectiveTo !== calculatedToDate) {
                            return { ...prev, effectiveTo: calculatedToDate };
                        }
                        return prev;
                    });
                } else if (years === 0 || formData.coverageYears === '') {
                    // Clear effectiveTo if years is 0 or empty
                    setFormData(prev => ({ ...prev, effectiveTo: '' }));
                }
            }
        } else if (formData.coverageYears === '' && !isManualEffectiveTo) {
            // Clear effectiveTo if coverageYears is empty
            setFormData(prev => ({ ...prev, effectiveTo: '' }));
        }
    }, [formData.effectiveFrom, formData.coverageYears, formData.lifetimeWarranty, isManualEffectiveTo]);
    
    // Handle coverageYears change
    const handleCoverageYearsChange = (years) => {
        const yearsNum = parseFloat(years);
        if (!isNaN(yearsNum) && yearsNum >= 0) {
            setFormData(prev => ({ ...prev, coverageYears: years }));
            setIsManualEffectiveTo(false); // Enable auto-calculation
        } else if (years === '') {
            setFormData(prev => ({ ...prev, coverageYears: '', effectiveTo: '' }));
            setIsManualEffectiveTo(false);
        }
    };
    
    // Handle effectiveFrom change
    const handleEffectiveFromChange = (date) => {
        setFormData(prev => ({ ...prev, effectiveFrom: date }));
        setIsManualEffectiveTo(false); // Re-enable auto-calculation if coverageYears exists
    };
    
    // Handle effectiveTo change (manual)
    const handleEffectiveToChange = (date) => {
        setFormData(prev => ({ ...prev, effectiveTo: date }));
        setIsManualEffectiveTo(true); // Mark as manually set - disable auto-calculation
    };
    
    // Handle lifetime warranty checkbox change
    const handleLifetimeWarrantyChange = (checked) => {
        if (checked) {
            // Enable lifetime warranty - clear effectiveTo
            setFormData(prev => ({
                ...prev,
                lifetimeWarranty: true,
                effectiveTo: ''
            }));
            setIsManualEffectiveTo(false);
        } else {
            // Disable lifetime warranty - allow normal date input
            setFormData(prev => ({
                ...prev,
                lifetimeWarranty: false
            }));
            setIsManualEffectiveTo(false);
        }
    };
    
    // Handle reset form - reset to initial state (empty or original condition values)
    const handleResetForm = () => {
        if (condition) {
            // If editing, reset to original condition values
            const effectiveFromDate = condition.effectiveFrom ? condition.effectiveFrom.split('T')[0] : '';
            const effectiveToDate = condition.effectiveTo ? condition.effectiveTo.split('T')[0] : '';
            const isLifetime = !effectiveToDate || effectiveToDate === '';
            
            setFormData({
                vehicleModelId: condition.vehicleModelId || vehicleModelId || '',
                coverageYears: condition.coverageYears || '',
                coverageKm: condition.coverageKm || '',
                conditionsText: condition.conditionsText || '',
                effectiveFrom: effectiveFromDate,
                effectiveTo: effectiveToDate,
                lifetimeWarranty: isLifetime,
                active: condition.active !== undefined ? condition.active : true
            });
        } else {
            // If creating new, reset to empty form
            setFormData({
                vehicleModelId: vehicleModelId || '',
                coverageYears: '',
                coverageKm: '',
                conditionsText: '',
                effectiveFrom: '',
                effectiveTo: '',
                lifetimeWarranty: false,
                active: true
            });
        }
        setIsManualEffectiveTo(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate vehicleModelId is required
        if (!formData.vehicleModelId || formData.vehicleModelId === '') {
            toast.error('Vui lòng chọn mẫu xe');
            return;
        }
        // Convert vehicleModelId to number if it exists
        const submitData = {
            ...formData,
            vehicleModelId: formData.vehicleModelId ? parseInt(formData.vehicleModelId, 10) : null,
            coverageYears: formData.coverageYears ? parseFloat(formData.coverageYears) : null,
            coverageKm: formData.coverageKm ? parseInt(formData.coverageKm, 10) : null,
            // If lifetime warranty, set effectiveTo to null
            effectiveTo: formData.lifetimeWarranty ? null : (formData.effectiveTo || null),
        };
        // Remove lifetimeWarranty from submitData (not needed in backend)
        delete submitData.lifetimeWarranty;
        onSave(submitData);
    };

    return (
        <motion.div
            className="warranty-condition-content-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3>{condition ? 'Chỉnh sửa Điều kiện Bảo hành' : 'Tạo Điều kiện Bảo hành Mới'}</h3>
            <form onSubmit={handleSubmit} className="warranty-condition-form-grid">
                <div className="warranty-condition-form-full-width">
                    <label>Mẫu Xe *</label>
                    <VehicleModelSearch
                        value={formData.vehicleModelId}
                        onChange={(modelId) => setFormData({ ...formData, vehicleModelId: modelId })}
                        disabled={!!vehicleModelId && !condition}
                        placeholder="Tìm kiếm theo tên hoặc mã mẫu xe..."
                    />
                </div>
                <div>
                    <label>Thời hạn Bảo hành (năm) *</label>
                    <input
                        type="number"
                        value={formData.coverageYears}
                        onChange={(e) => handleCoverageYearsChange(e.target.value)}
                        className="warranty-condition-form-input"
                        placeholder="Ví dụ: 3 hoặc 5"
                        min="0"
                        step="0.1"
                    />
                </div>
                <div>
                    <label>Quãng đường Bảo hành (km)</label>
                    <input
                        type="number"
                        value={formData.coverageKm}
                        onChange={(e) => setFormData({ ...formData, coverageKm: e.target.value })}
                        className="warranty-condition-form-input"
                        placeholder="Ví dụ: 100000"
                        min="0"
                    />
                </div>
                <div className="warranty-condition-form-date-group">
                    <div>
                        <label>Hiệu lực từ</label>
                        <DatePicker
                            value={formData.effectiveFrom}
                            onChange={handleEffectiveFromChange}
                            placeholder="Nhập DD/MM/YYYY"
                            minDate="1900-01-01"
                        />
                    </div>
                    <div className={`warranty-condition-effective-to-wrapper ${formData.lifetimeWarranty ? 'lifetime-warranty-enabled' : ''}`}>
                        <label>Hiệu lực đến</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            {formData.lifetimeWarranty ? (
                                <>
                                    <div 
                                        className="warranty-condition-effective-to-na" 
                                        tabIndex={-1}
                                        role="textbox"
                                        aria-readonly="true"
                                        aria-label="Hiệu lực đến: Không có thời hạn (N/A)"
                                        onFocus={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.target.blur();
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onKeyDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        N/A
                                    </div>
                                    {/* Invisible overlay covering the entire field area to block all interactions */}
                                    <div 
                                        className="warranty-condition-effective-to-overlay"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                        }}
                                        onMouseUp={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                        }}
                                        onFocus={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.target.blur();
                                            return false;
                                        }}
                                        onKeyDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                        }}
                                        onKeyUp={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            return false;
                                        }}
                                        tabIndex={-1}
                                        aria-hidden="true"
                                    />
                                </>
                            ) : (
                                <DatePicker
                                    value={formData.effectiveTo}
                                    onChange={handleEffectiveToChange}
                                    placeholder="Nhập DD/MM/YYYY"
                                    minDate="1900-01-01"
                                    disabled={false}
                                />
                            )}
                        </div>
                        <div className="warranty-condition-lifetime-warranty-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.lifetimeWarranty}
                                    onChange={(e) => handleLifetimeWarrantyChange(e.target.checked)}
                                />
                                <span>Không có thời hạn bảo hành (Bảo hành trọn đời)</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="warranty-condition-form-full-width">
                    <label>Mô tả Điều kiện</label>
                    <textarea
                        value={formData.conditionsText}
                        onChange={(e) => setFormData({ ...formData, conditionsText: e.target.value })}
                        className="warranty-condition-form-textarea"
                        placeholder="Mô tả chi tiết điều kiện/ngoại lệ bảo hành"
                        rows="4"
                    />
                </div>
                <div>
                    <label>Trạng thái</label>
                    <select
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                        className="warranty-condition-form-input warranty-condition-form-select"
                    >
                        <option value="true">Hoạt động</option>
                        <option value="false">Không hoạt động</option>
                    </select>
                </div>
                <div className="warranty-condition-form-actions">
                    <button type="submit" className="warranty-condition-submit-button" disabled={loading}>
                        {loading ? 'Đang lưu...' : (condition ? 'Cập nhật' : 'Tạo')}
                    </button>
                    <button
                        type="button"
                        onClick={handleResetForm}
                        className="warranty-condition-cancel-button"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// Component for detail lookup
const DetailLookup = ({ searchValue, setSearchValue, searchConditionDetail, conditionDetail, loading }) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading && searchValue.trim()) {
            searchConditionDetail();
        }
    };

    return (
        <motion.div
            className="warranty-condition-content-box warranty-condition-lookup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="warranty-condition-lookup-header">
                <h3>Tra cứu Chi tiết Điều kiện Bảo hành</h3>
                <p className="warranty-condition-lookup-subtitle">Tìm kiếm thông tin chi tiết về điều kiện bảo hành bằng ID</p>
            </div>

            <div className="warranty-condition-search-section">
                <div className="warranty-condition-search-group-enhanced">
                    <div className="warranty-condition-search-input-wrapper">
                        <FaHashtag className="warranty-condition-search-icon" />
                        <input
                            type="text"
                            placeholder="Nhập ID Điều kiện Bảo hành"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="warranty-condition-search-input"
                        />
                    </div>
                    <button 
                        onClick={searchConditionDetail} 
                        className="warranty-condition-search-button" 
                        disabled={loading || !searchValue.trim()}
                    >
                        <FaSearch />
                        {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                    </button>
                </div>
            </div>

            {conditionDetail && (
                <motion.div
                    className="warranty-condition-detail-card-enhanced"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="warranty-condition-detail-card-header">
                        <div className="warranty-condition-detail-icon-wrapper">
                            <FaFileContract className="warranty-condition-detail-icon" />
                        </div>
                        <div>
                            <h4>Chi tiết Điều kiện Bảo hành</h4>
                            <p className="warranty-condition-detail-subtitle">Thông tin đầy đủ về điều kiện bảo hành</p>
                        </div>
                    </div>

                    <div className="warranty-condition-detail-content">
                        <div className="warranty-condition-detail-item">
                            <div className="warranty-condition-detail-item-header">
                                <FaHashtag className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">ID</span>
                            </div>
                            <div className="warranty-condition-detail-item-value">{conditionDetail.id}</div>
                        </div>

                        <div className="warranty-condition-detail-item">
                            <div className="warranty-condition-detail-item-header">
                                <FaCar className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">Mã Mẫu Xe</span>
                            </div>
                            <div className="warranty-condition-detail-item-value">{conditionDetail.vehicleModelId}</div>
                        </div>

                        {conditionDetail.coverageYears && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaCalendarAlt className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Thời hạn (năm)</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">{conditionDetail.coverageYears} năm</div>
                            </div>
                        )}

                        {conditionDetail.coverageKm && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaRoad className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Quãng đường (km)</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">{conditionDetail.coverageKm.toLocaleString('vi-VN')} km</div>
                            </div>
                        )}

                        {conditionDetail.effectiveFrom && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaCalendarAlt className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Hiệu lực từ</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">
                                    {new Date(conditionDetail.effectiveFrom).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        )}

                        {conditionDetail.effectiveTo && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaCalendarAlt className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Hiệu lực đến</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">
                                    {new Date(conditionDetail.effectiveTo).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        )}

                        <div className="warranty-condition-detail-item warranty-condition-detail-item-full">
                            <div className="warranty-condition-detail-item-header">
                                <FaAlignLeft className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">Mô tả Điều kiện</span>
                            </div>
                            <div className="warranty-condition-detail-item-value warranty-condition-description-value">
                                {conditionDetail.conditionsText || <span className="warranty-condition-detail-empty">Không có mô tả</span>}
                            </div>
                        </div>

                        <div className="warranty-condition-detail-item">
                            <div className="warranty-condition-detail-item-header">
                                <FaInfoCircle className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">Trạng thái</span>
                            </div>
                            <div className="warranty-condition-detail-item-value">
                                <span className={`warranty-condition-status-enhanced ${conditionDetail.active ? 'active' : 'inactive'}`}>
                                    {conditionDetail.active ? (
                                        <>
                                            <FaCheckCircle className="warranty-condition-status-icon" />
                                            Hoạt động
                                        </>
                                    ) : (
                                        <>
                                            <FaTimesCircle className="warranty-condition-status-icon" />
                                            Không hoạt động
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// Main Component
const WarrantyConditionManagementPage = ({ handleBackClick }) => {
    const [activeTab, setActiveTab] = useState('all-conditions');
    const [warrantyConditions, setWarrantyConditions] = useState([]);
    const [effectiveConditions, setEffectiveConditions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [conditionDetail, setConditionDetail] = useState(null);
    const [editingCondition, setEditingCondition] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [modelSearchQuery, setModelSearchQuery] = useState('');
    const [effectiveModelSearchQuery, setEffectiveModelSearchQuery] = useState('');
    
    // Check if user can edit (only EVM_STAFF and ADMIN)
    const canEdit = userRole === 'EVM_STAFF' || userRole === 'ADMIN';

    // Get user role on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
            setUserRole(user.role);
        }
    }, []);

    // Helper to get auth headers
    const getAuthHeaders = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } : {};
    };

    const fetchWarrantyConditions = async (showToast = true) => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/warranty-conditions`, {
                headers: getAuthHeaders()
            });
            let fetchedConditions = res.data;
            fetchedConditions.sort((a, b) => (b.id || 0) - (a.id || 0));
            setWarrantyConditions(fetchedConditions);
            if (showToast) {
                toast.success('Đã tải điều kiện bảo hành thành công!');
            }
        } catch (err) {
            console.error(err);
            if (showToast) {
                toast.error('Lỗi khi tải điều kiện bảo hành');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchEffectiveConditions = async (showToast = true) => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/effective`, {
                headers: getAuthHeaders()
            });
            let fetchedConditions = res.data;
            fetchedConditions.sort((a, b) => (b.id || 0) - (a.id || 0));
            setEffectiveConditions(fetchedConditions);
            if (showToast) {
                toast.success('Đã tải điều kiện hiệu lực thành công!');
            }
        } catch (err) {
            console.error(err);
            if (showToast) {
                toast.error('Lỗi khi tải điều kiện hiệu lực');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCondition = async (formData) => {
        // Validate vehicleModelId
        if (!formData.vehicleModelId || formData.vehicleModelId <= 0) {
            toast.error('Vui lòng nhập Mã Mẫu Xe hợp lệ');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/warranty-conditions`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã tạo điều kiện bảo hành thành công!');
            setShowForm(false);
            setEditingCondition(null);
            // Chuyển sang tab "Tất cả điều kiện" sau khi tạo thành công
            setActiveTab('all-conditions');
            // Fetch data cho tab "all-conditions"
            fetchWarrantyConditions(false);
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi tạo điều kiện bảo hành';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCondition = async (formData) => {
        if (!editingCondition || !editingCondition.id) {
            toast.error('Chưa chọn điều kiện để chỉnh sửa');
            return;
        }

        // Validate vehicleModelId
        if (!formData.vehicleModelId || formData.vehicleModelId <= 0) {
            toast.error('Vui lòng nhập Mã Mẫu Xe hợp lệ');
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/${editingCondition.id}`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã cập nhật điều kiện bảo hành thành công!');
            setShowForm(false);
            setEditingCondition(null);
            if (activeTab === 'all-conditions') {
                fetchWarrantyConditions(false);
            } else if (activeTab === 'effective-conditions') {
                fetchEffectiveConditions(false);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật điều kiện bảo hành';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCondition = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa điều kiện bảo hành này?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/${id}`, {
                headers: getAuthHeaders()
            });
            toast.success('Đã xóa điều kiện bảo hành thành công!');
            if (activeTab === 'all-conditions') {
                fetchWarrantyConditions(false);
            } else if (activeTab === 'effective-conditions') {
                fetchEffectiveConditions(false);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi xóa điều kiện bảo hành';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEditCondition = (condition) => {
        setEditingCondition(condition);
        setShowForm(true);
        setActiveTab('create-edit');
    };

    const handleSaveCondition = (formData) => {
        if (editingCondition) {
            handleUpdateCondition(formData);
        } else {
            handleCreateCondition(formData);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCondition(null);
        setActiveTab('all-conditions');
    };

    const searchConditionDetail = async () => {
        if (!searchValue.trim()) {
            toast.warning('Vui lòng nhập ID điều kiện bảo hành');
            return;
        }

        setLoading(true);
        setConditionDetail(null);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/${searchValue}`, {
                headers: getAuthHeaders()
            });
            toast.success('Đã lấy chi tiết điều kiện bảo hành thành công!');
            setConditionDetail(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Không tìm thấy điều kiện bảo hành hoặc lỗi khi lấy chi tiết');
            setConditionDetail(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to render the active tab content
    const renderActiveTabContent = () => {
        if (showForm) {
            return (
                <WarrantyConditionForm
                    condition={editingCondition}
                    vehicleModelId={null}
                    onSave={handleSaveCondition}
                    onCancel={handleCancelForm}
                    loading={loading}
                />
            );
        }

        switch (activeTab) {
            case 'all-conditions':
                return (
                    <WarrantyConditionsTable
                        conditions={warrantyConditions}
                        loading={loading}
                        onEdit={handleEditCondition}
                        onDelete={handleDeleteCondition}
                        canEdit={canEdit}
                        searchQuery={modelSearchQuery}
                        onSearchChange={setModelSearchQuery}
                    />
                );
            case 'effective-conditions':
                return (
                    <WarrantyConditionsTable
                        conditions={effectiveConditions}
                        loading={loading}
                        onEdit={handleEditCondition}
                        onDelete={handleDeleteCondition}
                        canEdit={canEdit}
                        searchQuery={effectiveModelSearchQuery}
                        onSearchChange={setEffectiveModelSearchQuery}
                    />
                );
            case 'create-edit':
                return (
                    <WarrantyConditionForm
                        condition={editingCondition}
                        vehicleModelId={null}
                        onSave={handleSaveCondition}
                        onCancel={handleCancelForm}
                        loading={loading}
                    />
                );
            case 'detail-lookup':
                return (
                    <DetailLookup
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        searchConditionDetail={searchConditionDetail}
                        conditionDetail={conditionDetail}
                        loading={loading}
                    />
                );
            default:
                return (
                    <div className="warranty-condition-message">
                        <h3>Chào mừng đến với Quản lý Điều kiện Bảo hành</h3>
                        <p>Chọn một chức năng ở trên để quản lý điều kiện bảo hành.</p>
                    </div>
                );
        }
    };

    useEffect(() => {
        if (activeTab === 'all-conditions' && !showForm) {
            fetchWarrantyConditions();
            setModelSearchQuery(''); // Reset search when switching to all-conditions tab
        } else if (activeTab === 'effective-conditions' && !showForm) {
            fetchEffectiveConditions();
            setEffectiveModelSearchQuery(''); // Reset search when switching to effective-conditions tab
        } else if (activeTab === 'detail-lookup') {
            setConditionDetail(null);
            setSearchValue('');
        }
    }, [activeTab, showForm]);

    return (
        <div className="warranty-condition-page-wrapper">
            {/* Header Card */}
            <div className="warranty-condition-page-header">
                <button onClick={handleBackClick} className="warranty-condition-back-to-dashboard-button">
                    ← Quay lại Bảng điều khiển
                </button>
                <h2 className="warranty-condition-page-title">Quản lý Điều kiện Bảo hành</h2>

                {/* Navigation Group */}
                <div className="warranty-condition-nav-bar-group">
                    <motion.div
                        className="warranty-condition-tab-nav-bar"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button
                            onClick={() => {
                                setActiveTab('all-conditions');
                                setShowForm(false);
                                setEditingCondition(null);
                            }}
                            className={`warranty-condition-tab-button ${activeTab === 'all-conditions' && !showForm ? 'active' : ''}`}
                        >
                            Tất cả Điều kiện
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('effective-conditions');
                                setShowForm(false);
                                setEditingCondition(null);
                            }}
                            className={`warranty-condition-tab-button ${activeTab === 'effective-conditions' && !showForm ? 'active' : ''}`}
                        >
                            Điều kiện Hiệu lực
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => {
                                    setActiveTab('create-edit');
                                    setShowForm(true);
                                    setEditingCondition(null);
                                }}
                                className={`warranty-condition-tab-button ${activeTab === 'create-edit' || showForm ? 'active' : ''}`}
                            >
                                Tạo Điều kiện Mới
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setActiveTab('detail-lookup');
                                setShowForm(false);
                                setEditingCondition(null);
                            }}
                            className={`warranty-condition-tab-button ${activeTab === 'detail-lookup' && !showForm ? 'active' : ''}`}
                        >
                            Tra cứu Chi tiết
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="warranty-condition-page-content-area">
                {renderActiveTabContent()}
            </div>
        </div>
    );
};

export default WarrantyConditionManagementPage;

