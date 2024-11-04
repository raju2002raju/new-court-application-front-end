// Home.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar/Navbar';
import { baseUrl } from '../Config';
import ChatBot from '../ChatBot/ChatBot';
import './Home.css'

const Home = () => {
  const [templates, setTemplates] = useState([]);
  const [requirement, setRequirement] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [correctedText, setCorrectedText] = useState('');
  const [error, setError] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [documentText, setDocumentText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/documents`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.log('Error', error);
      setError('Failed to fetch templates');
    }
  };

  const formatLegalDocument = (text) => {
    try {
      const data = JSON.parse(text);
      const sections = [
        data.Case && `${centerText(data.Case)}`,
        data.court && `${centerText(data.court)}`,
        data.petition_no && `${data.petition_no}`,
        data.petitioner &&
    `\n ${data.petitioner.name}
    \n  ${data.petitioner.father_name}
    \n  ${data.petitioner.age}
    \n  ${data.petitioner.residence}`,
data.Versus && `${data.Versus}`
        ,
        data.respondent &&
        `\n ${data.respondent.name}
        \n  ${data.respondent.father_name}
        \n  ${data.respondent.age}
        \n  ${data.respondent.residence}`,
        data.act && `Under ${data.act}`,
        'AND',
        data.FamilyCourtsAct && `${data.FamilyCourtsAct}`,
        'AND',
        data.Divorce && `${data.Divorce}`,
        data.to && `${data.to}`,
        data.Honorable && `${data.Honorable}`,
        data.JUDGES && `${data.JUDGES}`,
        data.Honorable_Court && `${data.Honorable_Court}`,
        data.Petition_of && `${data.Petition_of}`,
        data.Petitioner_Abovenamed && `${data.Petitioner_Abovenamed}`,
        data.Respectfully && `${data.Respectfully}`,
        data.Point_1 && `${data.Point_1}`,
        data.Point_2 && `${data.Point_2}`,
        data.Point_3 && `${data.Point_3}`,
        data.Point_4 && `${data.Point_4}`,
        data.Point_5 && `${data.Point_5}`,
        data.Point_6 && `${data.Point_6}`,
        data.Point_7 && `${data.Point_7}`,
        data.Point_8 && `${data.Point_8}`,
        data.Point_9 && `${data.Point_9}`,
        data.Point_10 && `${data.Point_10}`,
        data.Point_11 && `${data.Point_11}`,
        data.Point_12 && `${data.Point_12}`,
        data.Point_13 && `${data.Point_13}`,
        data.Prayer && `${data.Prayer.prayer_heading} \n${data.Prayer.prayer_point_2} \n${data.Prayer.prayer_point_3} \n${data.Prayer.prayer_point_4} \n${data.Prayer.prayer_point_5} \n${data.Prayer.prayer_point_5} \n${data.Prayer.prayer_point_6} `,
        data.Advocate_details && `${data.Advocate_details.Petition_drawn} \n${data.Advocate_details.Advocate_name} \n${data.Advocate_details.Advocate_address} \n${data.Advocate_details.Advocate_contact} \n${data.Advocate_details.Advocate_email}`,
        data.verification && `${data.verification.verification_text}`    
      ];

      return sections.filter(Boolean).join('\n\n');
    } catch (e) {
      console.log('Text parsing error:', e);
      return text;
    }
  };

  const   centerText = (text) => {
    return text.toUpperCase();
  
  };
  
  const getFieldContext = (text, field) => {
    if (!text || !field) return '';
    
    const index = text.indexOf(field);
    if (index === -1) return '';
    
    const start = Math.max(0, index - 100);
    const end = Math.min(text.length, index + field.length + 100);
    return text.slice(start, end).trim();
  };

  const extractMissingFields = (text) => {
    if (!text) return [];
    
    const regex = /_{3,}|(__[^_\n]*__)/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        id: `missing_field_${matches.length + 1}`,
        value: match[0],
        context: getFieldContext(text, match[0]),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    return matches;
  };

  // Function to update document text when a field is filled
  const updateMissingField = (fieldValue, fieldIndex) => {
    const field = missingFields[fieldIndex];
    if (!field) return;

    // Create new document text with the updated field
    const before = documentText.slice(0, field.startIndex);
    const after = documentText.slice(field.endIndex);
    const newText = before + fieldValue + after;
    
    // Update document text
    setDocumentText(newText);
    
    // Update missing fields array
    const updatedFields = extractMissingFields(newText);
    setMissingFields(updatedFields);

    // Update displayed text
    setCorrectedText(formatLegalDocument(newText));
  };

  const handleCreateDraft = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          requirement: requirement
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create draft');
      }

      if (!data.correctedText) {
        throw new Error('No corrected text in response');
      }

  

      // Store the original text
      setDocumentText(data.correctedText);
      
      const formattedText = formatLegalDocument(data.correctedText);
      setCorrectedText(formattedText);
      
      // Extract missing fields after setting corrected text
      const missing = extractMissingFields(data.correctedText);
      setMissingFields(missing);
      
      setShowOutput(true);
      if (missing.length > 0) {
        setIsShow(true);
      }
      setRequirement('');
      setSelectedTemplate('');
    } catch (error) {
      console.error('Error details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setDownloading(true);
    try {
      // Ensure we have content to export
      if (!correctedText) {
        throw new Error('No content to export');
      }

      // Format the document data
      const documentData = {
        content: correctedText,
        // Add any additional metadata if needed
        title: 'Legal Document',
        date: new Date().toISOString(),
      };

      if (format === 'pdf') {
        await exportPDF(documentData);
      } else if (format === 'docx') {
        await exportDOCX(documentData);
      }
    } catch (error) {
      setError(`Export failed: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };
  
  const exportPDF = async (documentData) => {
    try {
      const response = await fetch(`${baseUrl}/api/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export PDF');
      }
  
      // Check if the response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid PDF response from server');
      }
  
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
  
      downloadFile(blob, `legal-document-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      throw new Error(`PDF export failed: ${error.message}`);
    }
  };
  
  const exportDOCX = async (documentData) => {
    try {
      const response = await fetch(`${baseUrl}/api/export/docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export DOCX');
      }
  
      // Check if the response is actually a DOCX file
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        throw new Error('Invalid DOCX response from server');
      }
  
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Generated DOCX is empty');
      }
  
      downloadFile(blob, `legal-document-${Date.now()}.docx`);
    } catch (error) {
      console.error('DOCX Export Error:', error);
      throw new Error(`DOCX export failed: ${error.message}`);
    }
  };
  
  const downloadFile = (blob, filename) => {
    if (!(blob instanceof Blob)) {
      throw new Error('Invalid file data');
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Input Section */}
          {!showOutput && (
             <div className="w-full bg-white rounded-lg shadow-md p-6">
             <div className="space-y-6">
               <div>
                 <label className="block text-gray-700 font-medium mb-2">
                   TYPE YOUR REQUIREMENT HERE
                 </label>
                 <textarea
                   placeholder="Type Your requirement Here..."
                   className="w-full h-52 border rounded-md outline-none p-4 focus:ring-2 focus:ring-blue-500"
                   value={requirement}
                   onChange={(e) => setRequirement(e.target.value)}
                 />
               </div>

               <div>
                 <select
                   value={selectedTemplate}
                   onChange={(e) => setSelectedTemplate(e.target.value)}
                   className="w-full p-4 border rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="">Select Type of Application</option>
                   {templates?.length > 0 ? (
                     templates.map((template) => (
                       <option key={template._id} value={template._id}>
                         {template.name.length > 96
                           ? `${template.name.substring(0, 96)}...`
                           : template.name}
                       </option>
                     ))
                   ) : (
                     <option disabled>No templates available</option>
                   )}
                 </select>
               </div>

               <button
                 className={`w-full py-4 px-6 rounded-md text-white font-bold text-xl transition-colors
                   ${loading 
                     ? 'bg-blue-400 cursor-not-allowed' 
                     : 'bg-blue-600 hover:bg-blue-700'
                   }`}
                 onClick={handleCreateDraft}
                 disabled={!selectedTemplate || !requirement || loading}
               >
                 {loading ? (
                   <div className="flex items-center justify-center gap-3">
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     Processing...
                   </div>
                 ) : (
                   'CREATE DRAFT'
                 )}
               </button>
             </div>
           </div>
          )}

          {/* Output Section */}
          {showOutput && (
             <div className='output-section'>
             <div className="w-full">
               <div className="bg-white rounded-lg shadow-md p-6">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-semibold">Generated Application</h2>
                   <div className="flex gap-3">
                     <button
                       onClick={() => {
                         setShowOutput(false);
                         setIsShow(false);
                         setCorrectedText('');
                         setDocumentText('');
                         setMissingFields([]);
                         setShowPreview(false);
                       }}
                       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                     >
                       Create New Draft
                     </button>
                     <button 
                       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                       onClick={() => {
                         setShowPreview(true);
                         setIsShow(false);
                       }}
                     >
                       Preview
                     </button>
                   </div>
                 </div>
                 
                 {loading ? (
                   <div className="flex flex-col items-center justify-center h-64 space-y-4">
                     <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-gray-600">Generating your application...</p>
                   </div>
                 ) : error ? (
                   <div className="text-red-600 p-4 rounded-md bg-red-50">
                     {error}
                   </div>
                 ) : correctedText ? (
                   <div className="prose max-w-none">
                     <div className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed p-4 bg-gray-50 rounded-lg overflow-y-auto height">
                       {correctedText}
                     </div>
                   </div>
                 ) : null}
               </div>
             </div>

             {/* Preview/Export Panel */}
             {showPreview && (
               <div className=" flex items-center justify-center p-4 w-3/6">
                 <div className="bg-white rounded-lg shadow-xl p-6 w-full">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-semibold">Document Preview & Export</h3>
                     <button 
                       onClick={() => setShowPreview(false)}
                       className="p-2 hover:bg-gray-100 rounded-full"
                     >
                       <span className="sr-only">Close</span>
                       ✕
                     </button>
                   </div>
                   
                   <div className="mb-4 flex gap-4">
                     <button
                       onClick={() => handleExport('pdf')}
                       disabled={downloading}
                       className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400"
                     >
                       {downloading ? 'Exporting...' : 'Export as PDF'}
                     </button>
                     <button
                       onClick={() => handleExport('docx')}
                       disabled={downloading}
                       className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                     >
                       {downloading ? 'Exporting...' : 'Export as DOCX'}
                     </button>
                   </div>
                   
                   <div className="bg-gray-50 p-6 rounded-lg overflow-y-auto max-h-[60vh]">
                     <div className="whitespace-pre-wrap font-serif">
                       {correctedText}
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* ChatBot */}
             {!showPreview && (
               <>
                 {isShow ? (
                   <div className="bg-white rounded-lg shadow-xl">
                     <div className="flex justify-between items-center p-4 border-b">
                       <h3 className="font-medium">Drafting Application Chat Bot</h3>
                       <button 
                         onClick={() => setIsShow(false)}
                         className="w-8 h-8  flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                       >
                         ✕
                       </button>
                     </div>
                     <ChatBot 
  missingFields={missingFields}
  onFieldUpdate={updateMissingField}
  data={templates} 
  correctedText={correctedText}
/>

                   </div>
                 ) : (
                   <button
                     onClick={() => setIsShow(true)}
                     className="fixed bottom-20 right-20 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
                   >
                     <span className="sr-only">Open Chat Bot</span>
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                     </svg>
                   </button>
                 )}
               </>
             )}
           </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;


