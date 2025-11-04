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
        toast.error('Failed to load parts catalog for search.');
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
        toast.error('Failed to load claim data.');
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
         toast.warn('Please complete the current part entry before adding a new one.');
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
              toast.success(`File ${fileName} uploaded successfully.`);
              // Add successful upload to existing attachments list
              setExistingAttachments(prev => [...prev, response.data]);
          } else {
              toast.error(`Failed to upload file ${fileName}: Server error.`);
          }
      } catch (error) {
          toast.error(`Failed to upload file ${fileName}: ${error.response?.data?.message || error.message}`);
      } finally {
          // 2. Remove from uploading state
          setUploadingFiles(prev => prev.filter(name => name !== fileName));
      }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []).filter(Boolean);
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
        toast.error('User not authenticated. Cannot upload file.');
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
            toast.warn(`File "${file.name}" is already uploaded or is currently uploading.`);
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
    
    toast.info(`Attempting to download ${link.download}...`);
  };

  
  const handleDeleteAttachment = async (attachmentId) => {
      if (isSubmitting) return;

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
          toast.error('User not authenticated.');
          return;
      }

      setIsSubmitting(true);
      try {
          const response = await axios.delete(
              `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachmentId}`,
              { headers: { 'Authorization': `Bearer ${user.token}` } }
          );

          if (response.status === 200) {
              toast.success('Attachment successfully deleted.');
              setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
          } else {
              toast.error('Failed to delete attachment: Server error.');
          }
      } catch (error) {
          toast.error(`Failed to delete attachment: ${error.response?.data?.message || error.message}`);
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
      toast.warn('Please fill in all required text/numeric fields.');
      return;
    }
    
    // NEW REQUIRED FIELD CHECK: readyForSubmission must be true
    if (!readyForSubmission) {
      toast.error('You must check "Ready For Submission" to finalize and submit the diagnostic report.');
      return;
    }
    
    if (uploadingFiles.length > 0) {
        toast.warn('Please wait for all attachments to finish uploading before submitting the diagnostic.');
        return;
    }
    
    const partsUsed = requiredParts
      .filter(part => part.partId && part.partName && part.quantity > 0)
      .map(part => ({
        partId: Number(part.partId),
        partSerialId: null, 
        quantity: Number(part.quantity),
        notes: `${part.partName} needed for repair.`, 
      }));
      
    for (const part of partsUsed) {
        if (isNaN(part.partId) || part.partId <= 0 || part.quantity <= 0) {
            toast.error('All required parts must have a valid Part ID and Quantity.');
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
        toast.success(`Diagnostic for claim ${claim.claimNumber} successfully updated and submitted!`);
        handleBackClick(); 
      } else {
        toast.info(`Diagnostic update successful with status code: ${response.status}`);
        handleBackClick();
      }

    } catch (error) {
      let errorMessage = 'An error occurred during diagnostic update.';
      if (error.response) {
        errorMessage = error.response.data?.message || `Error: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check network connection.';
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
        <div className="udp-loading-message">Loading claim details...</div>
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
                  This claim is not currently assigned to you. Diagnostic update is not allowed.
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
          Update Diagnostic - Claim {claim.claimNumber}
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
            <h3 className="udp-section-title">Diagnostic Summary & Notes</h3>
            
            {/* Summary and Initial Diagnosis (Inline group) */}
            <div className="udp-inline-group">
                {/* Diagnostic Summary */}
                <div className="udp-form-group">
                  <label htmlFor="diagnosticSummary">Diagnostic Summary *</label>
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
                  <label htmlFor="initialDiagnosis">Initial Diagnosis *</label>
                  <input
                    id="initialDiagnosis"
                    type="text"
                    value={initialDiagnosis}
                    onChange={(e) => setInitialDiagnosis(e.target.value)}
                    placeholder="e.g., Suspect battery pack failure"
                    required
                  />
                </div>
            </div>

            {/* Test Results & Repair Notes (Stacked, full width) */}
            <div className="udp-inline-group">
                {/* Test Results */}
                <div className="udp-form-group">
                  <label htmlFor="testResults">Test Results *</label>
                  <textarea
                    id="testResults"
                    value={testResults}
                    onChange={(e) => setTestResults(e.target.value)}
                    placeholder="e.g., OCV thấp, cell imbalance 40mV"
                    required
                    rows="3"
                  />
                </div>
                
                {/* Repair Notes */}
                <div className="udp-form-group">
                  <label htmlFor="repairNotes">Repair Notes *</label>
                  <textarea
                    id="repairNotes"
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="e.g., Đề xuất thay pack pin"
                    required
                    rows="3"
                  />
                </div>
            </div>

            {/* Full Diagnostic Details */}
            <div className="udp-form-group">
              <label htmlFor="diagnosticDetails">Diagnostic Details (Full Report) *</label>
              <textarea
                id="diagnosticDetails"
                value={diagnosticDetails}
                onChange={(e) => setDiagnosticDetails(e.target.value)}
                placeholder="e.g., Detailed steps taken for diagnosis and full findings..."
                required
                rows="6"
              />
            </div>
            
            {/* Numeric/Control Group (Inline) */}
            {/* REMOVED: Diagnostic Data and Estimated Repair Time fields */}
            <div className="udp-inline-group udp-grouped-fields udp-grouped-fields-reduced">
                {/* Labor Hours */}
                <div className="udp-form-group">
                    <label htmlFor="laborHours">Labor Hours *</label>
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
                  <label htmlFor="estimatedRepairCost">Estimated Cost (₫) *</label>
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
                         Ready For Submission *
                    </label>
                    <p className="udp-checkbox-note">Check this box to finalize the diagnostic report.</p>
                </div>
            </div>

          </motion.div>

          {/* Required Parts (Section 2 - Full Width) */}
          <motion.div className="udp-form-section udp-full-width" variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
             <h3 className="udp-section-title">Required Parts {partDataLoading && ' (Loading Catalog...)'}</h3>
            <div className="udp-parts-list" onClick={(e) => e.stopPropagation()}>
              {requiredParts.map((part, index) => (
                <div key={index} className="udp-part-item">
                  
                  <div className="udp-form-group part-name-group udp-search-container">
                    <label>Part Name / Search *</label> 
                    <input
                      type="text"
                      value={part.searchQuery} 
                      onChange={(e) => handlePartChange(index, 'searchQuery', e.target.value)}
                      onFocus={() => handleInputFocus(index)}
                      onBlur={() => handleInputBlur(index)}
                      placeholder="e.g., Battery Temperature Sensor"
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
                                    <p>Part not found.</p>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                  
                  <div className="udp-form-group part-id-group">
                    <label>Part ID *</label> 
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
                    <label>Quantity *</label>
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
                    title="Remove Part"
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
              <FaPlus /> Add Part
            </button>
          </motion.div>
          
          {/* Media Attachment Component (Full Width) */}
          <motion.div 
            className="udp-form-section udp-full-width" 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <h3 className="udp-section-title">Media Attachments</h3> 
            
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
                <FaUpload /> Select File(s) to Upload
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
                            title={file.status === 'uploaded' ? `Click to download ${file.name}` : file.name}
                        >
                            {file.name}
                        </span>

                        {/* Status Badge */}
                        <span className="udp-file-status">
                            {file.status === 'uploaded' ? 'Uploaded' : 'Uploading...'}
                        </span>

                        {/* Remove/Delete Button */}
                        <button 
                            type="button" 
                            onClick={file.status === 'uploaded' ? () => handleDeleteAttachment(file.id) : null}
                            className="udp-file-remove-btn"
                            title={file.status === 'uploaded' ? 'Delete File' : 'Cannot remove during upload'}
                            disabled={!file.id || isSubmitting} // Disable if no ID (means it's uploading) or submitting main form
                        >
                            <FaTimesCircle />
                        </button>
                    </div>
                ))}
                
                {/* Placeholder if no files are present/queued */}
                {filesToRender.length === 0 && (
                    <div className="udp-placeholder-box udp-file-info-box">
                        <p>No media files are currently attached or selected for upload.</p>
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
              <FaSave /> {isSubmitting ? 'Submitting...' : 'Submit Diagnostic'}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default UpdateDiagnosticPage;