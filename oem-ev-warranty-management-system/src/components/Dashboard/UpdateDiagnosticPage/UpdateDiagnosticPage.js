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
  const [diagnosticDetails, setDiagnosticDetails] = useState('');
  const [estimatedRepairCost, setEstimatedRepairCost] = useState('');
  const [estimatedRepairTime, setEstimatedRepairTime] = useState('');
  const [requiredParts, setRequiredParts] = useState([initialPart]);
  
  // --- MODIFIED: File/Attachment States ---
  // selectedFiles is REMOVED, as files are uploaded immediately.
  const [uploadingFiles, setUploadingFiles] = useState([]); // Tracks file names currently being uploaded
  const [existingAttachments, setExistingAttachments] = useState([]); // Files already on server (Attachment object)
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
          setDiagnosticDetails(claimData.diagnosticDetails || '');
          setEstimatedRepairCost(claimData.estimatedRepairCost || '');
          setEstimatedRepairTime(claimData.estimatedRepairTime || '');
          
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

  // --- Search Logic Helper ---
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

  // --- Part Management Handlers (omitted for brevity) ---
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

  
  // --- NEW: File Upload Logic ---
  
  // Function to handle the actual upload logic for a single file
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

  // --- MODIFIED: handleFileChange to trigger immediate upload ---
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
  
  // --- Download Existing Attachment (same as previous step) ---
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

  
  // --- Delete Existing Attachment API Call (same as previous step) ---
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
  // --- END Delete Handler ---
  
  
  // --- MODIFIED: Form Submission (Check for pending uploads) ---
  const handleSubmitDiagnostic = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!diagnosticDetails || !estimatedRepairCost || !estimatedRepairTime) {
      toast.warn('Please fill in Diagnostic Details, Estimated Cost, and Estimated Time.');
      return;
    }
    
    if (uploadingFiles.length > 0) {
        toast.warn('Please wait for all attachments to finish uploading before submitting the diagnostic.');
        return;
    }
    
    const cleanedParts = requiredParts
      .filter(part => part.partName && part.quantity > 0)
      .map(part => ({
        partId: Number(part.partId),
        partName: part.partName,
        quantity: Number(part.quantity),
      }));
      
    for (const part of cleanedParts) {
        if (isNaN(part.partId) || part.partId <= 0 || !part.partName || part.quantity <= 0) {
            toast.error('All required parts must have a valid Part ID, Part Name, and Quantity.');
            return;
        }
    }
    if (requiredParts.length === 1 && !requiredParts[0].partId && !requiredParts[0].partName && requiredParts[0].quantity === 1) {
        cleanedParts.length = 0; 
    }


    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // --- Upload step is removed from here as it happens immediately on file selection ---

      // --- STEP 2: Submit Diagnostic Data ---
      const payload = {
        claimId: claimId,
        diagnosticDetails: diagnosticDetails,
        estimatedRepairCost: parseFloat(estimatedRepairCost),
        estimatedRepairTime: estimatedRepairTime,
        requiredParts: cleanedParts,
        diagnosticImages: [], // Keeping placeholder as empty array
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

  // --- Rendering Helper: Combine files for display ---
  const filesToRender = [
      ...existingAttachments.map(att => ({ 
          id: att.id,
          name: att.filePath.split('/').pop(), 
          status: 'uploaded',
          filePath: att.filePath 
      })),
      ...uploadingFiles.map(name => ({ 
          id: `temp-${name}`, // Unique temporary ID for key
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
                      ← Back to Claim Details
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
          ← Back to Claim Details
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
          {/* Diagnostic Details (omitted for brevity) */}
          <motion.div className="udp-form-section" variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
            <h3 className="udp-section-title">Diagnostic Report</h3>
            <div className="udp-form-group">
              <label htmlFor="diagnosticDetails">Diagnostic Details *</label>
              <textarea
                id="diagnosticDetails"
                value={diagnosticDetails}
                onChange={(e) => setDiagnosticDetails(e.target.value)}
                placeholder="e.g., Battery management system diagnostic completed. Found faulty temperature sensor..."
                required
                rows="6"
              />
            </div>
            
            <div className="udp-inline-group">
              <div className="udp-form-group">
                <label htmlFor="estimatedRepairCost">Estimated Repair Cost (€) *</label>
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
              <div className="udp-form-group">
                <label htmlFor="estimatedRepairTime">Estimated Repair Time *</label>
                <input
                  id="estimatedRepairTime"
                  type="text"
                  value={estimatedRepairTime}
                  onChange={(e) => setEstimatedRepairTime(e.target.value)}
                  placeholder="e.g., 2-3 hours, 1 day"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Required Parts (omitted for brevity) */}
          <motion.div className="udp-form-section" variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}>
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
          
          {/* Media Attachment Component (Modified) */}
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

          {/* Submit Button */}
          <motion.div 
            className="udp-submit-area udp-full-width"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
            <button
              type="submit"
              className="udp-submit-button"
              disabled={isSubmitting || partDataLoading || uploadingFiles.length > 0} // Disable if uploading
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
