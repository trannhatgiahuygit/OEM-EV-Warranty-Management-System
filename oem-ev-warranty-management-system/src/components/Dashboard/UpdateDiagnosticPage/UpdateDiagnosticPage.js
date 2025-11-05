// UpdateDiagnosticPage.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash, FaSave, FaExclamationTriangle, FaTimesCircle, FaUpload, FaFileAlt } from 'react-icons/fa'; 
import './UpdateDiagnosticPage.css'; 

// Initial state for a new required part, now with search/query fields
const initialPart = {
  partId: '',
  partName: '',
  quantity: 1,
  searchQuery: '',
  searchResults: [],
  showResults: false,
};

const UpdateDiagnosticPage = ({ handleBackClick, claimId }) => {
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Remaining States
  const [diagnosticDetails, setDiagnosticDetails] = useState(''); 
  const [estimatedRepairCost, setEstimatedRepairCost] = useState(''); // This state is used for the input field value
  const [requiredParts, setRequiredParts] = useState([initialPart]);
  
  // --- NEW: Added States for Comprehensive Payload ---
  const [diagnosticSummary, setDiagnosticSummary] = useState(''); 
  // REMOVED: diagnosticData state
  const [testResults, setTestResults] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [laborHours, setLaborHours] = useState('');
  const [initialDiagnosis, setInitialDiagnosis] = useState(''); 
  // REMOVED: estimatedRepairTime state
  const [readyForSubmission, setReadyForSubmission] = useState(false);
  // --- END NEW States ---
  
  // --- MODIFIED: File/Attachment States ---
  const [uploadingFiles, setUploadingFiles] = useState([]); 
  const [existingAttachments, setExistingAttachments] = useState([]); 
  const fileInputRef = useRef(null);
  // --- END MODIFIED File/Attachment States ---
  
  const [allPartSerials, setAllPartSerials] = useState([]);
  const [partDataLoading, setPartDataLoading] = useState(false);

  const effectRan = useRef(false);

  // --- Data Fetching: Claim Details & Part Serials ---
  useEffect(() => {
    if (effectRan.current || !claimId) return;
    effectRan.current = true;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user.token;

    const fetchAllData = async () => {
      setLoading(true);
      
      // 1. Fetch Part Serials
      setPartDataLoading(true);
      try {
        const partResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/part-serials`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (partResponse.status === 200) {
          setAllPartSerials(partResponse.data);
        }
      } catch (err) {
        toast.error('Không thể tải danh mục phụ tùng để tìm kiếm.');
      } finally {
        setPartDataLoading(false);
      }
      
      // 2. Fetch Claim Details
      try {
        const claimResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (claimResponse.status === 200) {
          const claimData = claimResponse.data;
          setClaim(claimData);

          // Pre-populate fields
          // Note: diagnosticSummary and initialDiagnosis are intentionally empty on load as per previous request
          setDiagnosticSummary(claimData.diagnosticSummary || ''); 
          setInitialDiagnosis(claimData.initialDiagnosis || ''); 
          
          setDiagnosticDetails(claimData.diagnosticDetails || ''); 
          setEstimatedRepairCost(claimData.estimatedRepairCost || ''); 
          // REMOVED: setEstimatedRepairTime(claimData.estimatedRepairTime || ''); 
          // REMOVED: setDiagnosticData(claimData.diagnosticData || '');
          setTestResults(claimData.testResults || '');
          setRepairNotes(claimData.repairNotes || '');
          setLaborHours(claimData.laborHours || '');
          setReadyForSubmission(claimData.readyForSubmission || false);
          
          const existingParts = claimData.requiredParts?.length > 0 
              ? claimData.requiredParts.map(p => ({
                  ...initialPart,
                  partId: String(p.partId), 
                  partName: p.partName,
                  quantity: p.quantity,
                  searchQuery: p.partName, 
                })) 
              : [initialPart];
              
          setRequiredParts(existingParts);
          
          // Populate existing attachments
          setExistingAttachments(claimData.attachments || []);
        }
      } catch (err) {
        toast.error('Không thể tải dữ liệu yêu cầu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [claimId]);

  // --- Search Logic Helper (UNMODIFIED) ---
  const performPartSearch = (query) => {
    const queryLower = query.toLowerCase();
    if (queryLower.length < 2) return [];

    const filteredParts = allPartSerials.filter(part => 
      part.status === 'in_stock' && ( 
        part.partName.toLowerCase().includes(queryLower) ||
        part.partNumber.toLowerCase().includes(queryLower) ||
        String(part.partId).includes(queryLower)
      )
    );
    
    const uniqueParts = [];
    const seenPartKeys = new Set();
    
    filteredParts.forEach(part => {
        const partKey = `${part.partId}-${part.partName}`;
        if (!seenPartKeys.has(partKey)) {
            uniqueParts.push(part);
            seenPartKeys.add(partKey);
        }
    });

    return uniqueParts;
  };
  // --- End Search Logic Helper ---

  // --- Part Management Handlers (UNMODIFIED) ---
  const handlePartChange = (index, field, value) => {
    const newParts = [...requiredParts];
    newParts[index][field] = value;

    if (field === 'searchQuery') {
      newParts[index].searchResults = performPartSearch(value);
      newParts[index].showResults = true;
      newParts[index].partId = '';
      newParts[index].partName = '';
    } else if (field === 'quantity') {
      newParts[index].quantity = Math.max(1, parseInt(value, 10) || 1); 
    }
    
    setRequiredParts(newParts);
  };
  
  const handlePartSelect = (index, part) => {
    const newParts = [...requiredParts];
    newParts[index] = {
      ...newParts[index],
      partId: String(part.partId), 
      partName: part.partName,
      searchQuery: part.partName, 
      searchResults: [],
      showResults: false,
    };
    setRequiredParts(newParts);
  };
  
  const handleInputFocus = (index) => {
      const newParts = [...requiredParts];
      if (newParts[index].searchQuery.length > 0 && newParts[index].searchResults.length > 0) {
          newParts[index].showResults = true;
      }
      setRequiredParts(newParts);
  }

  const handleInputBlur = (index) => {
    setTimeout(() => {
        setRequiredParts(prev => prev.map((item, i) => 
            i === index ? { ...item, showResults: false } : item
        ));
    }, 200); 
  }

  const handleAddPart = () => {
    const lastPart = requiredParts[requiredParts.length - 1];
    if (lastPart && lastPart.partId && lastPart.partName && lastPart.quantity > 0) {
        setRequiredParts([...requiredParts, initialPart]);
    } else if (requiredParts.length === 1 && !lastPart.partId) {
         setRequiredParts([...requiredParts, initialPart]);
    } else {
         toast.warn('Vui lòng hoàn tất mục phụ tùng hiện tại trước khi thêm mục mới.');
    }
  };

  const handleRemovePart = (index) => {
    const newParts = requiredParts.filter((_, i) => i !== index);
    setRequiredParts(newParts.length > 0 ? newParts : [initialPart]); 
  };
  // --- End Part Management Handlers ---

  
  // --- File Upload Logic (UNMODIFIED) ---
  
  const uploadFileImmediately = async (file, token) => {
      const fileName = file.name;

      // 1. Add to uploading state
      setUploadingFiles(prev => [...prev, fileName]);
      
      const formData = new FormData();
      formData.append('file', file);

      try {
          const response = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/upload`,
              formData,
              {
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'multipart/form-data',
                  },
              }
          );

          if (response.status === 200 || response.status === 201) {
              toast.success(`Tệp ${fileName} đã được tải lên thành công.`);
              // Add successful upload to existing attachments list
              setExistingAttachments(prev => [...prev, response.data]);
          } else {
              toast.error(`Không thể tải lên tệp ${fileName}: Lỗi máy chủ.`);
          }
      } catch (error) {
          toast.error(`Không thể tải lên tệp ${fileName}: ${error.response?.data?.message || error.message}`);
      } finally {
          // 2. Remove from uploading state
          setUploadingFiles(prev => prev.filter(name => name !== fileName));
      }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []).filter(Boolean);
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
        toast.error('Người dùng chưa được xác thực. Không thể tải lên tệp.');
        return;
    }
    const token = user.token;

    newFiles.forEach(file => {
        // Prevent duplicate uploads (by name, regardless of case)
        const fileNameLower = file.name.toLowerCase();
        const isDuplicate = existingAttachments.some(att => att.filePath.toLowerCase().includes(fileNameLower)) ||
                            uploadingFiles.map(n => n.toLowerCase()).includes(fileNameLower);
        
        if (!isDuplicate) {
            uploadFileImmediately(file, token);
        } else {
            toast.warn(`Tệp "${file.name}" đã được tải lên hoặc đang được tải lên.`);
        }
    });

    if (fileInputRef.current) {
        fileInputRef.current.value = null; // Clear the file input
    }
  };
  
  const handleDownloadAttachment = (filePath) => {
    const downloadUrl = `${process.env.REACT_APP_API_URL}${filePath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank'; 
    link.rel = 'noopener noreferrer';
    link.download = filePath.split('/').pop() || 'attachment'; 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.info(`Đang tải xuống ${link.download}...`);
  };

  
  const handleDeleteAttachment = async (attachmentId) => {
      if (isSubmitting) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
          toast.error('Người dùng chưa được xác thực.');
          return;
      }

      setIsSubmitting(true);
      try {
          const response = await axios.delete(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachmentId}`,
              { headers: { 'Authorization': `Bearer ${user.token}` } }
          );

          if (response.status === 200) {
              toast.success('Tệp đính kèm đã được xóa thành công.');
              setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
          } else {
              toast.error('Không thể xóa tệp đính kèm: Lỗi máy chủ.');
          }
      } catch (error) {
          toast.error(`Không thể xóa tệp đính kèm: ${error.response?.data?.message || error.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };
  // --- END File Upload Logic ---
  
  
  // --- Form Submission (MODIFIED PAYLOAD) ---
  const handleSubmitDiagnostic = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation update: CHECK ALL REQUIRED FIELDS
    if (!diagnosticSummary || !initialDiagnosis || !testResults || !repairNotes || !laborHours || !estimatedRepairCost) {
      toast.warn('Vui lòng điền tất cả các trường văn bản/số bắt buộc.');
      return;
    }
    
    // NEW REQUIRED FIELD CHECK: readyForSubmission must be true
    if (!readyForSubmission) {
      toast.error('Bạn phải chọn "Sẵn sàng Gửi" để hoàn tất và gửi báo cáo chẩn đoán.');
      return;
    }
    
    if (uploadingFiles.length > 0) {
        toast.warn('Vui lòng đợi tất cả tệp đính kèm tải lên xong trước khi gửi chẩn đoán.');
        return;
    }
    
    const partsUsed = requiredParts
      .filter(part => part.partId && part.partName && part.quantity > 0)
      .map(part => ({
        partId: Number(part.partId),
        partSerialId: null, 
        quantity: Number(part.quantity),
        notes: `${part.partName} cần thiết cho sửa chữa.`, 
      }));
      
    for (const part of partsUsed) {
        if (isNaN(part.partId) || part.partId <= 0 || part.quantity <= 0) {
            toast.error('Tất cả phụ tùng bắt buộc phải có ID Phụ tùng và Số lượng hợp lệ.');
            return;
        }
    }
    if (requiredParts.length === 1 && !requiredParts[0].partId && !requiredParts[0].partName && requiredParts[0].quantity === 1) {
        partsUsed.length = 0; 
    }
    
    const attachmentPaths = existingAttachments.map(att => att.filePath);


    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // --- STEP 2: Submit Diagnostic Data (COMPREHENSIVE PAYLOAD) ---
      const payload = {
        claimId: claimId,
        diagnosticSummary: diagnosticSummary,
        // REMOVED: diagnosticData
        testResults: testResults,
        repairNotes: repairNotes,
        laborHours: parseFloat(laborHours),
        initialDiagnosis: initialDiagnosis,
        readyForSubmission: readyForSubmission, // Will be 'true' here
        diagnosticDetails: diagnosticDetails, 
        // MODIFIED: Renamed estimatedRepairCost to warrantyCost in the payload
        warrantyCost: parseFloat(estimatedRepairCost), 
        // REMOVED: estimatedRepairTime
        partsUsed: partsUsed, 
        attachmentPaths: attachmentPaths, 
        diagnosticImages: [], 
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/diagnostic`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Chẩn đoán cho yêu cầu ${claim.claimNumber} đã được cập nhật và gửi thành công!`);
        handleBackClick(); 
      } else {
        toast.info(`Cập nhật chẩn đoán thành công với mã trạng thái: ${response.status}`);
        handleBackClick();
      }

    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi khi cập nhật chẩn đoán.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Lỗi: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Rendering Helper: Combine files for display (UNMODIFIED) ---
  const filesToRender = [
      ...existingAttachments.map(att => ({ 
          id: att.id,
          name: att.filePath.split('/').pop(), 
          status: 'uploaded',
          filePath: att.filePath 
      })),
      ...uploadingFiles.map(name => ({ 
          id: `temp-${name}`, 
          name, 
          status: 'uploading' 
      }))
  ];


  if (loading) {
    return (
      <div className="udp-page-wrapper">
        <div className="udp-loading-message">Đang tải chi tiết yêu cầu...</div>
      </div>
    );
  }
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAssigned = claim.assignedTechnician && claim.assignedTechnician.id === user.userId;
  
  if (!isAssigned) {
      return (
          <div className="udp-page-wrapper">
              <div className="udp-error-message">
                  <FaExclamationTriangle className="udp-warning-icon" />
                  Yêu cầu này hiện không được phân công cho bạn. Không được phép cập nhật chẩn đoán.
              </div>
              <div className="udp-back-container">
                  <button onClick={handleBackClick} className="udp-back-button">
                      ← Quay lại Chi tiết Yêu cầu
                  </button>
              </div>
          </div>
      );
  }


  return (
    <motion.div
      className="udp-page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="udp-page-header">
        <button onClick={handleBackClick} className="udp-back-button">
          ← Quay lại Chi tiết Yêu cầu
        </button>
        <h2 className="udp-page-title">
          Cập nhật Chẩn đoán - Yêu cầu {claim.claimNumber}
        </h2>
      </div>

      <div className="udp-content-area">
        <motion.form 
          onSubmit={handleSubmitDiagnostic}
          className="udp-form-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {/* Main Diagnostic Fields (Full Width) */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
            <h3 className="udp-section-title">Tóm tắt Chẩn đoán & Ghi chú</h3>
            
            {/* Summary and Initial Diagnosis (Inline group) */}
            <div className="udp-inline-group">
                {/* Diagnostic Summary */}
                <div className="udp-form-group">
                  <label htmlFor="diagnosticSummary">Tóm tắt Chẩn đoán *</label>
                  <input
                    id="diagnosticSummary"
                    type="text"
                    value={diagnosticSummary}
                    onChange={(e) => setDiagnosticSummary(e.target.value)}
                    placeholder="e.g., BMS lỗi, pin không nhận sạc"
                    required
                  />
                </div>

                {/* Initial Diagnosis */}
                <div className="udp-form-group">
                  <label htmlFor="initialDiagnosis">Chẩn đoán Ban đầu *</label>
                  <input
                    id="initialDiagnosis"
                    type="text"
                    value={initialDiagnosis}
                    onChange={(e) => setInitialDiagnosis(e.target.value)}
                    placeholder="ví dụ: Nghi ngờ lỗi bộ pin"
                    required
                  />
                </div>
            </div>

            {/* Test Results & Repair Notes (Stacked, full width) */}
            <div className="udp-inline-group">
                {/* Test Results */}
                <div className="udp-form-group">
                  <label htmlFor="testResults">Kết quả Kiểm tra *</label>
                  <textarea
                    id="testResults"
                    value={testResults}
                    onChange={(e) => setTestResults(e.target.value)}
                    placeholder="ví dụ: OCV thấp, mất cân bằng cell 40mV"
                    required
                    rows="3"
                  />
                </div>
                
                {/* Repair Notes */}
                <div className="udp-form-group">
                  <label htmlFor="repairNotes">Ghi chú Sửa chữa *</label>
                  <textarea
                    id="repairNotes"
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="ví dụ: Đề xuất thay bộ pin"
                    required
                    rows="3"
                  />
                </div>
            </div>

            {/* Full Diagnostic Details */}
            <div className="udp-form-group">
              <label htmlFor="diagnosticDetails">Chi tiết Chẩn đoán (Báo cáo Đầy đủ) *</label>
              <textarea
                id="diagnosticDetails"
                value={diagnosticDetails}
                onChange={(e) => setDiagnosticDetails(e.target.value)}
                placeholder="ví dụ: Các bước chi tiết đã thực hiện cho chẩn đoán và phát hiện đầy đủ..."
                required
                rows="6"
              />
            </div>
            
            {/* Numeric/Control Group (Inline) */}
            {/* REMOVED: Diagnostic Data and Estimated Repair Time fields */}
            <div className="udp-inline-group udp-grouped-fields udp-grouped-fields-reduced">
                {/* Labor Hours */}
                <div className="udp-form-group">
                    <label htmlFor="laborHours">Giờ Lao động *</label>
                    <input
                      id="laborHours"
                      type="number"
                      step="0.1"
                      value={laborHours}
                      onChange={(e) => setLaborHours(e.target.value)}
                      placeholder="2.5"
                      required
                    />
                </div>
                {/* Estimated Repair Cost */}
                <div className="udp-form-group">
                  {/* The input name remains 'Estimated Cost' for the user */}
                  <label htmlFor="estimatedRepairCost">Chi phí Ước tính (₫) *</label>
                  <input
                    id="estimatedRepairCost"
                    type="number"
                    step="0.01"
                    value={estimatedRepairCost}
                    onChange={(e) => setEstimatedRepairCost(e.target.value)}
                    placeholder="250.00"
                    required
                  />
                </div>
                {/* Ready For Submission Checkbox */}
                 <div className="udp-form-group udp-checkbox-group">
                    {/* MODIFIED: Added * to label for required status */}
                    <label htmlFor="readyForSubmission">
                        <input
                            id="readyForSubmission"
                            type="checkbox"
                            checked={readyForSubmission}
                            onChange={(e) => setReadyForSubmission(e.target.checked)}
                            // Note: Required is enforced via JS validation, not HTML attribute
                        />
                         Sẵn sàng Gửi *
                    </label>
                    <p className="udp-checkbox-note">Chọn hộp này để hoàn tất báo cáo chẩn đoán.</p>
                </div>
            </div>

          </motion.div>

          {/* Required Parts (Section 2 - Full Width) */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
             <h3 className="udp-section-title">Phụ tùng Bắt buộc {partDataLoading && ' (Đang tải Danh mục...)'}</h3>
            <div className="udp-parts-list" onClick={(e) => e.stopPropagation()}>
              {requiredParts.map((part, index) => (
                <div key={index} className="udp-part-item">
                  
                  <div className="udp-form-group part-name-group udp-search-container">
                    <label>Tên Phụ tùng / Tìm kiếm *</label> 
                    <input
                      type="text"
                      value={part.searchQuery} 
                      onChange={(e) => handlePartChange(index, 'searchQuery', e.target.value)}
                      onFocus={() => handleInputFocus(index)}
                      onBlur={() => handleInputBlur(index)}
                      placeholder="ví dụ: Cảm biến Nhiệt độ Pin"
                      required
                      autoComplete="off"
                    />
                    {part.showResults && part.searchQuery.length > 0 && (
                        <div className="udp-search-results">
                            {part.searchResults.length > 0 ? (
                                part.searchResults.map((result) => (
                                    <div
                                        key={`${result.partId}-${result.partNumber}`}
                                        className="udp-search-result-item"
                                        onMouseDown={(e) => { e.preventDefault(); handlePartSelect(index, result); }} 
                                    >
                                        <p><strong>{result.partName}</strong></p>
                                        <p>ID: {result.partId} | Number: {result.partNumber}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="udp-search-result-item">
                                    <p>Không tìm thấy phụ tùng.</p>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                  
                  <div className="udp-form-group part-id-group">
                    <label>ID Phụ tùng *</label> 
                    <input
                      type="number"
                      value={part.partId}
                      onChange={(e) => handlePartChange(index, 'partId', e.target.value)}
                      placeholder="e.g., 6"
                      required
                      min="1"
                    />
                  </div>
                  
                  <div className="udp-form-group part-quantity-group">
                    <label>Số lượng *</label>
                    <input
                      type="number"
                      min="1"
                      value={part.quantity}
                      onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                      placeholder="1"
                      required
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="udp-remove-part-btn"
                    title="Xóa Phụ tùng"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddPart}
              className="udp-add-part-btn"
              disabled={partDataLoading}
            >
              <FaPlus /> Thêm Phụ tùng
            </button>
          </motion.div>
          
          {/* Media Attachment Component (Full Width) */}
          <motion.div 
            className="udp-form-section udp-full-width" 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h3 className="udp-section-title">Tệp đính kèm Phương tiện</h3> 
            
            <input 
                type="file"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }} // Hide native input
                id="file-upload"
            />
            
            {/* Custom Upload Button */}
            <button 
                type="button" 
                className="udp-add-part-btn"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isSubmitting} // Disable file select if main form is submitting
            >
                <FaUpload /> Chọn Tệp để Tải lên
            </button>
            
            {/* File List Display */}
            <div className="udp-file-list">
                
                {filesToRender.map((file) => (
                    <div 
                        key={file.id || file.name} 
                        className={`udp-file-item ${file.status === 'uploaded' ? 'udp-existing-file' : 'udp-uploading-file'}`}
                    >
                        {file.status === 'uploading' ? (
                            <FaUpload className="udp-file-icon udp-icon-spin" />
                        ) : (
                            <FaFileAlt className="udp-file-icon" />
                        )}
                        
                        <span 
                            className={`udp-file-name ${file.status === 'uploaded' ? 'udp-download-link' : ''}`}
                            onClick={file.status === 'uploaded' ? () => handleDownloadAttachment(file.filePath) : null} 
                            title={file.status === 'uploaded' ? `Nhấp để tải xuống ${file.name}` : file.name}
                        >
                            {file.name}
                        </span>

                        {/* Status Badge */}
                        <span className="udp-file-status">
                            {file.status === 'uploaded' ? 'Đã tải lên' : 'Đang tải lên...'}
                        </span>

                        {/* Remove/Delete Button */}
                        <button 
                            type="button" 
                            onClick={file.status === 'uploaded' ? () => handleDeleteAttachment(file.id) : null}
                            className="udp-file-remove-btn"
                            title={file.status === 'uploaded' ? 'Xóa Tệp' : 'Không thể xóa trong khi tải lên'}
                            disabled={!file.id || isSubmitting} // Disable if no ID (means it's uploading) or submitting main form
                        >
                            <FaTimesCircle />
                        </button>
                    </div>
                ))}
                
                {/* Placeholder if no files are present/queued */}
                {filesToRender.length === 0 && (
                    <div className="udp-placeholder-box udp-file-info-box">
                        <p>Hiện không có tệp phương tiện nào được đính kèm hoặc được chọn để tải lên.</p>
                    </div>
                )}
            </div>
          </motion.div>

          {/* Submit Button (Full Width) */}
          <motion.div 
            className="udp-submit-area udp-full-width"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <button
              type="submit"
              className="udp-submit-button"
              disabled={isSubmitting || partDataLoading || uploadingFiles.length > 0} 
            >
              <FaSave /> {isSubmitting ? 'Đang gửi...' : 'Gửi Chẩn đoán'}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default UpdateDiagnosticPage;