'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ImportJob {
  id: string;
  fileName: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  progressPercent: number;
  estimatedTimeRemaining: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errors: Array<{
    row: number;
    sku: string | null;
    message: string;
  }>;
  results: {
    successful: number;
    failed: number;
    successfulProducts: Array<{
      id: string;
      name: string;
      sku: string | null;
      stockQuantity: number;
    }>;
  } | null;
}

export default function BulkProductUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  // Poll for job status if there's an active job
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentJob && (currentJob.status === 'pending' || currentJob.status === 'processing')) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/products/import-status/${currentJob.id}`);
          if (response.ok) {
            const updatedJob = await response.json();
            setCurrentJob(updatedJob);
            
            // Stop polling when job is complete
            if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentJob]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'admin'); // You might want to get this from session

      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Start polling for this job
        setCurrentJob({
          id: data.jobId,
          fileName: data.fileName,
          status: 'pending',
          totalRecords: 0,
          processedRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          progressPercent: 0,
          estimatedTimeRemaining: null,
          createdAt: new Date().toISOString(),
          startedAt: null,
          completedAt: null,
          errors: [],
          results: null,
        });
        
        // Clear the file input
        setFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (error: any) {
      setError('Network error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Name,Price,SKU,Description,Short Description,Compare Price,Cost Price,Category ID,Subcategory ID,Supplier ID,Tags,Weight,Is Featured,Is Active,Is Digital,Requires Shipping,Taxable,Meta Title,Meta Description,Tax Amount,Tax Percentage,HS Code,Product Type,Stock Management Type,Stock Quantity,Status,Location
"Premium Product 1","29.99","PROD-001","High quality premium product with detailed description","Premium quality product","39.99","20.00","cat-123","subcat-456","sup-789","electronics,premium,new","0.5","true","true","false","true","true","Premium Product - Best Quality","Premium product with amazing features","2.50","8.5","1234567890","simple","quantity","100","Initial Stock","Warehouse A"
"Digital Service","19.99","DIG-001","Digital download service","Instant download","","15.00","cat-456","","","digital,service,download","","false","true","true","false","true","Digital Service - Instant Access","Download digital service instantly","","","","simple","quantity","0","",""`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const resetJob = () => {
    setCurrentJob(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Bulk Import</h1>
              <p className="text-gray-600 mt-1">
                Import large numbers of products with stock information via CSV files
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Template Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Template</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Required columns:</strong> Name, Price<br/>
              <strong>Stock columns:</strong> Stock Quantity, Status (reason), Location<br/>
              <strong>Pricing columns:</strong> Compare Price, Cost Price, Tax Amount, Tax Percentage<br/>
              <strong>Organization:</strong> SKU, Category ID, Subcategory ID, Supplier ID, Tags<br/>
              <strong>Settings:</strong> Is Featured, Is Active, Is Digital, Requires Shipping, Taxable<br/>
              <strong>SEO:</strong> Meta Title, Meta Description<br/>
              <strong>Advanced:</strong> HS Code, Product Type, Stock Management Type, Weight
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📄 Download CSV Template
          </button>
          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="ml-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            {showTemplate ? 'Hide' : 'Show'} Template Details
          </button>
        </div>

        {/* Template Details */}
        {showTemplate && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">CSV Column Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Required Fields</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>Name</strong> - Product name</li>
                  <li>• <strong>Price</strong> - Selling price</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Basic Information</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• <strong>SKU</strong> - Product code</li>
                  <li>• <strong>Description</strong> - Full description</li>
                  <li>• <strong>Short Description</strong> - Brief summary</li>
                  <li>• <strong>Weight</strong> - Product weight</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Valid Stock Status Values</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Initial Stock (default)</li>
                  <li>• Purchase Order</li>
                  <li>• Stock Return</li>
                  <li>• Transfer In</li>
                  <li>• Supplier Return</li>
                  <li>• Production Complete</li>
                  <li>• Other</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!currentJob && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {file && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-700">
                    <strong>Selected file:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`px-6 py-3 rounded-md font-medium ${
                  !file || uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {uploading ? 'Starting Import...' : '🚀 Start Import'}
              </button>
            </div>
          </div>
        )}

        {/* Progress Section */}
        {currentJob && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Import Progress</h2>
              {(currentJob.status === 'completed' || currentJob.status === 'failed') && (
                <button
                  onClick={resetJob}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  New Import
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentJob.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  currentJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  currentJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
                </span>
                <span className="text-sm text-gray-600">
                  File: {currentJob.fileName}
                </span>
              </div>

              {/* Progress Bar */}
              {currentJob.totalRecords > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      Progress: {currentJob.processedRecords} / {currentJob.totalRecords} products
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {currentJob.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentJob.status === 'completed' ? 'bg-green-500' :
                        currentJob.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${currentJob.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Stats */}
              {(currentJob.successfulRecords > 0 || currentJob.failedRecords > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm text-green-600 font-medium">Successful</p>
                    <p className="text-2xl font-bold text-green-800">{currentJob.successfulRecords}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-md">
                    <p className="text-sm text-red-600 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-800">{currentJob.failedRecords}</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {currentJob.status === 'completed' && currentJob.results && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="font-medium text-green-800 mb-2">Import Completed Successfully!</h3>
                    <p className="text-sm text-green-700">
                      {currentJob.results.successful} products imported successfully
                      {currentJob.results.failed > 0 && ` (${currentJob.results.failed} failed)`}
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push('/products')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Products
                    </button>
                    <button
                      onClick={() => router.push('/inventory')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      View Inventory
                    </button>
                  </div>
                </div>
              )}

              {/* Errors */}
              {currentJob.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Errors ({currentJob.errors.length}):</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 max-h-40 overflow-y-auto">
                    {currentJob.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 py-1">
                        Row {error.row}: {error.message}
                        {error.sku && ` (SKU: ${error.sku})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}