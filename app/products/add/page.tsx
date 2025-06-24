'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '../../components/ImageUploader';

/**
 * Enhanced Variation System for E-commerce Products
 * 
 * This system provides a user-friendly way to handle product variations with:
 * 1. Structured attribute storage with type information
 * 2. Frontend-optimized data format for easy consumption
 * 3. Automatic UI component selection based on attribute types
 * 4. Comprehensive variant generation with detailed metadata
 * 
 * Data Structure:
 * - VariationMatrix: Main container with attributes, variants, and defaults
 * - Attributes: Store type info to determine UI rendering (color swatches, dropdowns, radio buttons)
 * - Variants: Detailed variant info with complete attribute metadata
 * 
 * Frontend Rendering Logic:
 * - Color attributes → Color swatches with visual feedback
 * - Attributes with >5 values → Dropdown select
 * - Attributes with ≤5 values → Radio button group
 */

interface DatabaseVariationAttribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  values: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>;
}

/**
 * Enhanced VariationAttribute interface for internal use
 * Stores selected attribute values with complete metadata
 */
interface VariationAttribute {
  id: string;
  name: string;
  type: string; // Used to determine frontend UI component
  slug: string; // For URL-friendly attribute names
  values: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string; // For color swatches
    image?: string; // For image-based attributes
  }>;
}

/**
 * Enhanced GeneratedVariant interface with detailed attribute metadata
 * Each variant stores complete information about its attribute combinations
 */
interface GeneratedVariant {
  id?: string;
  title: string;
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    attributeType: string; // Critical for frontend rendering
    attributeSlug: string;
    valueId: string;
    value: string;
    valueSlug: string;
    colorCode?: string;
    image?: string;
  }>;
  price: string;
  comparePrice: string;
  costPrice: string;
  sku: string;
  weight: string;
  inventoryQuantity: number;
  image: string;
  isActive: boolean;
}

interface Addon {
  id: string;
  title: string;
  price: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
}

interface SelectedAddon {
  addonId: string;
  addonTitle: string;
  price: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Frontend-optimized variation matrix
 * This structure is specifically designed for easy frontend consumption
 */
interface VariationMatrix {
  attributes: Array<{
    id: string;
    name: string;
    type: string; // Determines UI component: 'color' | 'size' | 'material' | etc.
    slug: string;
    values: Array<{
      id: string;
      value: string;
      slug: string;
      colorCode?: string;
      image?: string;
    }>;
  }>;
  variants: GeneratedVariant[];
  defaultSelections?: { [attributeId: string]: string }; // For setting default selections
}

export default function AddProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    subcategoryId: '',
    tags: '',
    weight: '',
    isFeatured: false,
    isActive: true,
    isDigital: false,
    requiresShipping: true,
    taxable: true,
    metaTitle: '',
    metaDescription: '',
    productType: 'simple' // 'simple' or 'variable'
  });
  
  // Variable product specific states
  const [availableAttributes, setAvailableAttributes] = useState<DatabaseVariationAttribute[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<VariationAttribute[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [showVariantGeneration, setShowVariantGeneration] = useState(false);
  
  // Group product specific states
  const [availableAddons, setAvailableAddons] = useState<Addon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubcategories(formData.categoryId);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (formData.productType === 'variable' && selectedAttributes.length > 0) {
      generateVariants();
    } else {
      setGeneratedVariants([]);
    }
  }, [selectedAttributes, formData.productType]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, attributesRes, addonsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/variation-attributes?includeValues=true'),
        fetch('/api/addons')
      ]);
      
      const categoriesData = await categoriesRes.json();
      const attributesData = await attributesRes.json();
      const addonsData = await addonsRes.json();
      
      setCategories(categoriesData);
      setAvailableAttributes(attributesData);
      setAvailableAddons(addonsData.filter((addon: Addon) => addon.isActive));
    } catch (err) {
      console.error(err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const res = await fetch('/api/subcategories');
      const data = await res.json();
      const filtered = data.filter((sub: any) => sub.categoryId === categoryId);
      setSubcategories(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleImageUpload = (imageUrl: string) => {
    setImages([...images, imageUrl]);
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Variation attribute management
  const addSelectedAttribute = (attributeId: string) => {
    const attribute = availableAttributes.find(attr => attr.id === attributeId);
    if (!attribute) return;

    const isAlreadySelected = selectedAttributes.some(attr => attr.id === attributeId);
    if (isAlreadySelected) return;

    setSelectedAttributes([...selectedAttributes, {
      id: attribute.id,
      name: attribute.name,
      type: attribute.type,
      slug: attribute.slug,
      values: []
    }]);
  };

  const updateSelectedAttributeValues = (attributeId: string, selectedValueObjects: Array<{
    id: string;
    value: string;
    slug: string;
    colorCode?: string;
    image?: string;
  }>) => {
    const updated = selectedAttributes.map(attr => 
      attr.id === attributeId 
        ? { ...attr, values: selectedValueObjects }
        : attr
    );
    setSelectedAttributes(updated);
  };

  const removeSelectedAttribute = (attributeId: string) => {
    setSelectedAttributes(selectedAttributes.filter(attr => attr.id !== attributeId));
  };

  // Addon management functions
  const addSelectedAddon = (addonId: string) => {
    const addon = availableAddons.find(addon => addon.id === addonId);
    if (!addon) return;

    const isAlreadySelected = selectedAddons.some(selected => selected.addonId === addonId);
    if (isAlreadySelected) return;

    setSelectedAddons([...selectedAddons, {
      addonId: addon.id,
      addonTitle: addon.title,
      price: addon.price,
      isRequired: false,
      sortOrder: selectedAddons.length,
      isActive: true
    }]);
  };

  const updateSelectedAddon = (addonId: string, field: keyof SelectedAddon, value: any) => {
    const updated = selectedAddons.map(addon => 
      addon.addonId === addonId 
        ? { ...addon, [field]: value }
        : addon
    );
    setSelectedAddons(updated);
  };

  const removeSelectedAddon = (addonId: string) => {
    setSelectedAddons(selectedAddons.filter(addon => addon.addonId !== addonId));
  };

  // Generate all possible variant combinations
  const generateVariants = () => {
    if (selectedAttributes.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    const validAttributes = selectedAttributes.filter(attr => attr.values.length > 0);
    if (validAttributes.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    // Generate cartesian product of all attribute values
    const combinations: Array<{ [key: string]: { id: string; value: string; slug: string; colorCode?: string; image?: string; } }> = [];
    
    const generateCombinations = (index: number, current: { [key: string]: { id: string; value: string; slug: string; colorCode?: string; image?: string; } }) => {
      if (index === validAttributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attribute = validAttributes[index];
      for (const valueObj of attribute.values) {
        current[attribute.name] = valueObj;
        generateCombinations(index + 1, current);
      }
    };

    generateCombinations(0, {});

    const variants: GeneratedVariant[] = combinations.map((combo, index) => {
      const title = Object.entries(combo).map(([key, valueObj]) => `${key}: ${valueObj.value}`).join(' / ');
      const skuSuffix = Object.values(combo).map(valueObj => valueObj.value).join('-').toLowerCase().replace(/[^a-z0-9]/g, '');
      
      return {
        title,
        attributes: Object.entries(combo).map(([attrName, valueObj]) => {
          const selectedAttr = selectedAttributes.find(attr => attr.name === attrName);
          return {
            attributeId: selectedAttr?.id || '',
            attributeName: attrName,
            attributeType: selectedAttr?.type || '',
            attributeSlug: selectedAttr?.slug || '',
            valueId: valueObj.id,
            value: valueObj.value,
            valueSlug: valueObj.slug,
            colorCode: valueObj.colorCode,
            image: valueObj.image
          };
        }),
        price: formData.price || '0',
        comparePrice: formData.comparePrice || '',
        costPrice: formData.costPrice || '',
        sku: formData.sku ? `${formData.sku}-${skuSuffix}` : '',
        weight: formData.weight || '',
        inventoryQuantity: 0,
        image: '',
        isActive: true
      };
    });

    setGeneratedVariants(variants);
  };

  const updateVariant = (index: number, field: keyof GeneratedVariant, value: any) => {
    const updated = [...generatedVariants];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedVariants(updated);
  };

  // Generate variation matrix for frontend consumption
  const generateVariationMatrix = (): VariationMatrix => {
    return {
      attributes: selectedAttributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        slug: attr.slug,
        values: attr.values
      })),
      variants: generatedVariants,
      defaultSelections: selectedAttributes.reduce((acc, attr) => {
        if (attr.values.length > 0) {
          acc[attr.id] = attr.values[0].id; // Set first value as default
        }
        return acc;
      }, {} as { [attributeId: string]: string })
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate group products with zero price must have addons
    if (formData.productType === 'group' && (!formData.price || parseFloat(formData.price) === 0) && selectedAddons.length === 0) {
      setError('Group products with zero price must have at least one addon');
      setSubmitting(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : (formData.productType === 'group' ? 0 : 0),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: images.length > 0 ? images : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        // Enhanced variation data structure
        variationMatrix: formData.productType === 'variable' ? generateVariationMatrix() : null,
        // Keep legacy format for backwards compatibility
        variationAttributes: formData.productType === 'variable' ? selectedAttributes : null,
        variants: formData.productType === 'variable' ? generatedVariants : null,
        addons: formData.productType === 'group' ? selectedAddons : null,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-6xl">
        {/* Product Type Selection */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Product Type</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="simple"
                checked={formData.productType === 'simple'}
                onChange={handleChange}
                className="mr-2"
              />
              Simple Product
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="variable"
                checked={formData.productType === 'variable'}
                onChange={handleChange}
                className="mr-2"
              />
              Variable Product (with variations)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="productType"
                value="group"
                checked={formData.productType === 'group'}
                onChange={handleChange}
                className="mr-2"
              />
              Group Product (with addons)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="slug">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                placeholder="auto-generated-from-name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="shortDescription">
                Short Description
              </label>
              <textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="sku">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Column - Pricing & Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing & Details</h3>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="price">
                Price {formData.productType !== 'group' && <span className="text-red-500">*</span>}
                {formData.productType === 'group' && (
                  <span className="text-sm text-gray-500 block">
                    (Optional for group products - price will come from addons)
                  </span>
                )}
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
                required={formData.productType !== 'group'}
                placeholder={formData.productType === 'group' ? '0.00 (optional)' : ''}
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="comparePrice">
                Compare Price
              </label>
              <input
                type="number"
                id="comparePrice"
                name="comparePrice"
                value={formData.comparePrice}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="costPrice">
                Cost Price
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="categoryId">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select a category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="subcategoryId">
                Subcategory
              </label>
              <select
                id="subcategoryId"
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                disabled={!formData.categoryId}
              >
                <option value="">Select a subcategory</option>
                {subcategories.map((subcategory: any) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="tags">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="weight">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Product Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img src={image} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => handleImageRemove(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <ImageUploader
            currentImage=""
            onImageUpload={handleImageUpload}
            onImageRemove={() => {}}
            label="Add Product Image"
            disabled={submitting}
            directory="products"
          />
        </div>

        {/* Variable Product Variation Attributes */}
        {formData.productType === 'variable' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">🔧 Variation Attributes</h3>
            
            {/* Add New Attribute */}
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Add Variation Attribute</h4>
              <select
                onChange={(e) => e.target.value && addSelectedAttribute(e.target.value)}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                value=""
              >
                <option value="">Select an attribute to add...</option>
                {availableAttributes
                  .filter(attr => !selectedAttributes.some(selected => selected.id === attr.id))
                  .map((attr) => (
                    <option key={attr.id} value={attr.id}>
                      {attr.name} ({attr.type})
                    </option>
                  ))}
              </select>
            </div>

            {/* Selected Attributes */}
            <div className="space-y-4">
              {selectedAttributes.map((selectedAttr) => {
                const dbAttribute = availableAttributes.find(attr => attr.id === selectedAttr.id);
                if (!dbAttribute) return null;

                return (
                  <div key={selectedAttr.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">
                        {selectedAttr.name} 
                        <span className="ml-2 text-sm text-gray-500">({dbAttribute.type})</span>
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Frontend: {dbAttribute.type === 'color' ? 'Color Swatches' : 
                                   dbAttribute.values.length > 5 ? 'Dropdown' : 'Radio Buttons'}
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeSelectedAttribute(selectedAttr.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Select values for {selectedAttr.name}:
                      </label>
                      
                      {/* Render different UI based on attribute type */}
                      {dbAttribute.type === 'color' ? (
                        // Color swatches preview
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Color Swatch Preview (Frontend UI):</div>
                          <div className="flex flex-wrap gap-2 mb-3 p-2 bg-gray-50 rounded">
                            {dbAttribute.values.map((value) => (
                              <div
                                key={value.id}
                                className={`relative w-8 h-8 rounded-full border-2 cursor-pointer ${
                                  selectedAttr.values.some(v => v.id === value.id) 
                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                    : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: value.colorCode || '#ccc' }}
                                title={value.value}
                              >
                                {selectedAttr.values.some(v => v.id === value.id) && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : dbAttribute.values.length > 5 ? (
                        // Dropdown preview
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Dropdown Preview (Frontend UI):</div>
                          <select className="w-full p-2 border rounded bg-gray-50 mb-3" disabled>
                            <option>Choose {selectedAttr.name}...</option>
                            {selectedAttr.values.map((value, idx) => (
                              <option key={idx} value={value.value}>{value.value}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        // Radio buttons preview
                        <div>
                          <div className="text-xs text-gray-500 mb-2">Radio Button Preview (Frontend UI):</div>
                          <div className="space-y-1 p-2 bg-gray-50 rounded mb-3">
                            {selectedAttr.values.slice(0, 3).map((value, idx) => (
                              <label key={idx} className="flex items-center">
                                <input type="radio" name={`preview-${selectedAttr.id}`} className="mr-2" disabled />
                                <span className="text-sm">{value.value}</span>
                              </label>
                            ))}
                            {selectedAttr.values.length > 3 && (
                              <div className="text-xs text-gray-400">...and {selectedAttr.values.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Value selection checkboxes */}
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Available Values (Admin Selection):</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {dbAttribute.values.map((value) => (
                            <label key={value.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedAttr.values.some(v => v.id === value.id)}
                                onChange={(e) => {
                                  const newValues = e.target.checked
                                    ? [...selectedAttr.values, value]
                                    : selectedAttr.values.filter(v => v.id !== value.id);
                                  updateSelectedAttributeValues(selectedAttr.id, newValues);
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {value.value}
                                {value.colorCode && (
                                  <span 
                                    className="inline-block w-4 h-4 rounded-full ml-1 border"
                                    style={{ backgroundColor: value.colorCode }}
                                  ></span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Selected: {selectedAttr.values.map(v => v.value).join(', ') || 'None'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {generatedVariants.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Generated Variants ({generatedVariants.length})</h4>
                  <button
                    type="button"
                    onClick={() => setShowVariantGeneration(!showVariantGeneration)}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    {showVariantGeneration ? 'Hide' : 'Show'} Variants
                  </button>
                </div>

                {showVariantGeneration && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {generatedVariants.map((variant, index) => (
                      <div key={index} className="p-3 border rounded bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Variant Title</label>
                            <input
                              type="text"
                              value={variant.title}
                              onChange={(e) => updateVariant(index, 'title', e.target.value)}
                              className="w-full p-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Price</label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariant(index, 'price', e.target.value)}
                              className="w-full p-1 text-sm border rounded"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">SKU</label>
                            <input
                              type="text"
                              value={variant.sku}
                              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                              className="w-full p-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Inventory</label>
                            <input
                              type="number"
                              value={variant.inventoryQuantity}
                              onChange={(e) => updateVariant(index, 'inventoryQuantity', parseInt(e.target.value) || 0)}
                              className="w-full p-1 text-sm border rounded"
                              min="0"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Attributes</label>
                          <div className="text-sm text-gray-500">
                            {variant.attributes.map((attr, index) => (
                              <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded mr-2 mb-1">
                                {attr.attributeName}: {attr.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Group Product Addons */}
        {formData.productType === 'group' && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">🧩 Product Addons</h3>
            
            {/* Add New Addon */}
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Add Addon to Product</h4>
              <select
                onChange={(e) => e.target.value && addSelectedAddon(e.target.value)}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                value=""
              >
                <option value="">Select an addon to add...</option>
                {availableAddons
                  .filter(addon => !selectedAddons.some(selected => selected.addonId === addon.id))
                  .map((addon) => (
                    <option key={addon.id} value={addon.id}>
                      {addon.title} - ${parseFloat(addon.price).toFixed(2)}
                    </option>
                  ))}
              </select>
              {availableAddons.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No addons available. <a href="/addons/add" className="text-blue-500 hover:underline">Create some addons first</a>.
                </p>
              )}
            </div>

            {/* Selected Addons */}
            <div className="space-y-4">
              {selectedAddons.map((selectedAddon) => {
                const addon = availableAddons.find(a => a.id === selectedAddon.addonId);

                return (
                  <div key={selectedAddon.addonId} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">
                        {selectedAddon.addonTitle}
                        {addon?.description && (
                          <span className="block text-sm text-gray-600">{addon.description}</span>
                        )}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeSelectedAddon(selectedAddon.addonId)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Override Price ($)
                        </label>
                        <input
                          type="number"
                          value={selectedAddon.price}
                          onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'price', e.target.value)}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          step="0.01"
                          min="0"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Original price: ${addon ? parseFloat(addon.price).toFixed(2) : '0.00'}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={selectedAddon.sortOrder}
                          onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'sortOrder', parseInt(e.target.value) || 0)}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          min="0"
                        />
                      </div>

                      <div className="flex flex-col justify-center space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAddon.isRequired}
                            onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'isRequired', e.target.checked)}
                            className="mr-2"
                          />
                          Required Addon
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAddon.isActive}
                            onChange={(e) => updateSelectedAddon(selectedAddon.addonId, 'isActive', e.target.checked)}
                            className="mr-2"
                          />
                          Active
                        </label>
                      </div>
                    </div>

                    {addon?.image && (
                      <div className="mt-3">
                        <img 
                          src={addon.image} 
                          alt={addon.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedAddons.length === 0 && (
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                No addons selected. 
                {(!formData.price || parseFloat(formData.price) === 0) ? (
                  <span className="block text-red-500 font-medium mt-1">
                    You must add at least one addon for group products with zero price.
                  </span>
                ) : (
                  <span>Add some addons to create a group product.</span>
                )}
              </div>
            )}

            {/* Group Product Pricing Summary */}
            {formData.productType === 'group' && selectedAddons.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Pricing Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Product Price:</span>
                    <span>${formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Addon Prices:</span>
                    <span>${selectedAddons.reduce((total, addon) => total + parseFloat(addon.price), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-blue-300">
                    <span>Maximum Product Price:</span>
                    <span>${(
                      (formData.price ? parseFloat(formData.price) : 0) + 
                      selectedAddons.reduce((total, addon) => total + parseFloat(addon.price), 0)
                    ).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    * Final price depends on which addons customer selects
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="mr-2"
              />
              Featured Product
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              Active
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isDigital"
                checked={formData.isDigital}
                onChange={handleChange}
                className="mr-2"
              />
              Digital Product
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiresShipping"
                checked={formData.requiresShipping}
                onChange={handleChange}
                className="mr-2"
              />
              Requires Shipping
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="taxable"
                checked={formData.taxable}
                onChange={handleChange}
                className="mr-2"
              />
              Taxable
            </label>
          </div>
        </div>

        {/* SEO */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="metaTitle">
                Meta Title
              </label>
              <input
                type="text"
                id="metaTitle"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="metaDescription">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 