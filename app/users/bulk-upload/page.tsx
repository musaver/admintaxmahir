'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ImportJob {
  id: string;
  fileName: string;
  status: string;
  type: string; // 'users' or 'products'
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
    email?: string;
    identifier?: string;
    message: string;
  }>;
  results: {
    successful: number;
    failed: number;
    successfulUsers?: Array<{
      id: string;
      name: string;
      email: string;
    }>;
    successfulProducts?: Array<{
      id: string;
      name: string;
      sku: string;
    }>;
  } | null;
}

export default function BulkUserUpload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if we should default to products tab
  const defaultTab = searchParams.get('tab') === 'products' ? 'products' : 'users';
  const [activeTab, setActiveTab] = useState<'users' | 'products'>(defaultTab);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState('');

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

  const downloadTemplate = () => {
    let csvContent = '';
    let fileName = '';
    
    if (activeTab === 'users') {
      csvContent = `Name,Email,Buyer NTN Or CNIC,Buyer Business Name,Buyer Province,Buyer Address,Buyer Registration Type
"John Doe","john.doe@example.com","1234567890123","Doe Industries","Punjab","123 Business Street, Lahore","Individual"
"Jane Smith","jane.smith@example.com","9876543210987","Smith Trading Co","Sindh","456 Commerce Avenue, Karachi","Company"
"Ahmed Khan","ahmed.khan@example.com","1122334455667","Khan Enterprises","KPK","789 Market Road, Peshawar","Partnership"`;
      fileName = 'bulk_user_import_template.csv';
    } else {
      csvContent = `Product SKU,Product Title,Product Price,Product Description
"PROD-001","Sample Product","29.99","A great product description"
"PROD-002","Another Product","49.99","Another excellent product"
"PROD-003","Third Product","19.99","Third amazing product description"`;
      fileName = 'bulk_product_import_template.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
      formData.append('uploadedBy', 'current-user'); // TODO: Get from auth context
      formData.append('type', activeTab); // Add import type

      const response = await fetch('/api/users/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Start polling for status
      startStatusPolling(data.jobId);

    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  const startStatusPolling = (jobId: string) => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/users/import-status/${jobId}`);
        const job: ImportJob = await response.json();
        
        setCurrentJob(job);

        if (job.status === 'completed' || job.status === 'failed') {
          setUploading(false);
          return; // Stop polling
        }

        // Continue polling if still processing
        setTimeout(pollStatus, 2000);
      } catch (error) {
        console.error('Error polling status:', error);
        setUploading(false);
      }
    };

    pollStatus();
  };

  const resetForm = () => {
    setFile(null);
    setCurrentJob(null);
    setError('');
    setUploading(false);
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return 'Calculating...';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Bulk Import</h1>
          <button
            onClick={() => router.push(activeTab === 'users' ? '/users' : '/products')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to {activeTab === 'users' ? 'Users' : 'Products'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('users');
                  resetForm();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Import Users
              </button>
              <button
                onClick={() => {
                  setActiveTab('products');
                  resetForm();
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Import Products
              </button>
            </nav>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">📋 Instructions</h2>
          <ul className="space-y-2 text-blue-700">
            <li>• Download the CSV template below to see the required format</li>
            {activeTab === 'users' ? (
              <>
                <li>• Required fields: <strong>Name, Email</strong></li>
                <li>• Optional fields: Buyer NTN/CNIC, Business Name, Province, Address, Registration Type</li>
                <li>• Supports up to 100MB files (~200,000 users)</li>
                <li>• Duplicate emails within your tenant will be skipped</li>
              </>
            ) : (
              <>
                <li>• Required fields: <strong>Product SKU, Product Title, Product Price</strong></li>
                <li>• Optional fields: Product Description</li>
                <li>• Supports up to 100MB files (~300,000 products)</li>
                <li>• Duplicate SKUs within your tenant will be skipped</li>
              </>
            )}
            <li>• Processing happens in background - you'll see real-time progress</li>
            <li>• Save your file as CSV format</li>
          </ul>
        </div>

        {/* Download Template */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">📥 Download Template</h2>
          <p className="text-gray-600 mb-4">
            Download the {activeTab === 'users' ? 'user' : 'product'} CSV template with the correct format and sample data.
          </p>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            📄 Download {activeTab === 'users' ? 'User' : 'Product'} CSV Template
          </button>
        </div>

        {/* Upload Form */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📤 Upload {activeTab === 'users' ? 'Users' : 'Products'}</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="csvFile">
                Select CSV File
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Processing...' : 'Start Import'}
              </button>
              
              {(file || currentJob) && (
                <button
                  onClick={resetForm}
                  disabled={uploading}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress & Status */}
        {currentJob && (
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">📊 Import Progress</h2>
            
            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                currentJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                currentJob.status === 'failed' ? 'bg-red-100 text-red-800' :
                currentJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {currentJob.status.charAt(0).toUpperCase() + currentJob.status.slice(1)}
              </span>
            </div>

            {/* Progress Bar */}
            {currentJob.totalRecords > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress: {currentJob.processedRecords} / {currentJob.totalRecords}</span>
                  <span>{currentJob.progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentJob.progressPercent}%` }}
                  ></div>
                </div>
                {currentJob.status === 'processing' && currentJob.estimatedTimeRemaining && (
                  <p className="text-sm text-gray-600 mt-1">
                    Estimated time remaining: {formatTimeRemaining(currentJob.estimatedTimeRemaining)}
                  </p>
                )}
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-800">
                  {currentJob.successfulRecords}
                </div>
                <div className="text-green-600">Successful</div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-800">
                  {currentJob.failedRecords}
                </div>
                <div className="text-red-600">Failed</div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-800">
                  {currentJob.processedRecords}
                </div>
                <div className="text-blue-600">Total Processed</div>
              </div>
            </div>

            {/* Success Details */}
            {currentJob.type === 'users' && currentJob.results?.successfulUsers && Array.isArray(currentJob.results.successfulUsers) && currentJob.results.successfulUsers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-green-800 mb-2">✅ Successfully Created Users (showing first 20)</h3>
                <div className="bg-green-50 border border-green-200 rounded p-3 max-h-60 overflow-y-auto">
                  {currentJob.results.successfulUsers.slice(0, 20).map((user, index) => (
                    <div key={index} className="text-sm text-green-700 mb-1">
                      {user.name} ({user.email})
                    </div>
                  ))}
                  {currentJob.results.successfulUsers.length > 20 && (
                    <div className="text-sm text-green-600 italic">
                      ... and {currentJob.results.successfulUsers.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentJob.type === 'products' && currentJob.results?.successfulProducts && Array.isArray(currentJob.results.successfulProducts) && currentJob.results.successfulProducts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-green-800 mb-2">✅ Successfully Created Products (showing first 20)</h3>
                <div className="bg-green-50 border border-green-200 rounded p-3 max-h-60 overflow-y-auto">
                  {currentJob.results.successfulProducts.slice(0, 20).map((product, index) => (
                    <div key={index} className="text-sm text-green-700 mb-1">
                      {product.name} (SKU: {product.sku})
                    </div>
                  ))}
                  {currentJob.results.successfulProducts.length > 20 && (
                    <div className="text-sm text-green-600 italic">
                      ... and {currentJob.results.successfulProducts.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Details */}
            {currentJob.errors && Array.isArray(currentJob.errors) && currentJob.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-red-800 mb-2">❌ Errors (showing first 20)</h3>
                <div className="bg-red-50 border border-red-200 rounded p-3 max-h-60 overflow-y-auto">
                  {currentJob.errors.slice(0, 20).map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-2">
                      <strong>Row {error.row}:</strong> {error.message}
                      <div className="ml-4 text-red-600">
                        {currentJob.type === 'users' 
                          ? `Email: ${error.email || 'N/A'}`
                          : `SKU: ${error.identifier || 'N/A'}`
                        }
                      </div>
                    </div>
                  ))}
                  {currentJob.errors.length > 20 && (
                    <div className="text-sm text-red-600 italic">
                      ... and {currentJob.errors.length - 20} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentJob.status === 'completed' && (
              <div className="pt-4 border-t">
                <button
                  onClick={() => router.push(currentJob.type === 'users' ? '/users' : '/products')}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  View All {currentJob.type === 'users' ? 'Users' : 'Products'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
