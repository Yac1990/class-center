'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, Save, Package, ToggleLeft, ToggleRight,
  RefreshCw, ShoppingCart, Truck, Check, X, Image as ImageIcon,
  Loader2, BarChart3, Download, Search, Mail, TrendingUp, DollarSign,
  Users, Calendar, ArrowUpRight, Share2, Link,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/commissions'

// ==========================================
// Types
// ==========================================
interface FlashProduct {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  images: string
  category: string
  stock: number
  active: boolean
  featured: boolean
  position: number
  saleEndsAt: string | null
  createdAt: string
  updatedAt: string
  _count?: { orders: number }
}

interface FlashOrder {
  id: string
  productId: string
  clientName: string
  clientPhone: string
  deliveryAddress: string
  deliveryCity: string
  quantity: number
  amount: number
  status: string
  note: string
  createdAt: string
  updatedAt: string
  product: FlashProduct
}

interface PromotionalEmail {
  id: string
  email: string
  name: string
  source: string
  createdAt: string
}

// ==========================================
// Category labels
// ==========================================
const CATEGORY_LABELS: Record<string, string> = {
  general: 'Général',
  electronics: 'Électronique',
  fashion: 'Mode',
  phone: 'Téléphone',
  food: 'Alimentation',
  beauty: 'Beauté',
  home: 'Maison',
  other: 'Autre',
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-500/20 text-gray-400',
  electronics: 'bg-blue-500/20 text-blue-400',
  fashion: 'bg-pink-500/20 text-pink-400',
  phone: 'bg-cyan-500/20 text-cyan-400',
  food: 'bg-green-500/20 text-green-400',
  beauty: 'bg-purple-500/20 text-purple-400',
  home: 'bg-amber-500/20 text-amber-400',
  other: 'bg-white/10 text-[#a89080]',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-orange-500/20 text-orange-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  SHIPPED: 'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
}

const SOURCE_LABELS: Record<string, string> = {
  FLASH_ORDER: 'Commande Flash',
  NEWSLETTER: 'Newsletter',
  MANUAL: 'Manuel',
}

const SOURCE_COLORS: Record<string, string> = {
  FLASH_ORDER: 'bg-orange-500/20 text-orange-400',
  NEWSLETTER: 'bg-blue-500/20 text-blue-400',
  MANUAL: 'bg-green-500/20 text-green-400',
}

// ==========================================
// Main Component
// ==========================================
export function AdminFlashProducts() {
  const [products, setProducts] = useState<FlashProduct[]>([])
  const [orders, setOrders] = useState<FlashOrder[]>([])
  const [promotionalEmails, setPromotionalEmails] = useState<PromotionalEmail[]>([])
  const [activeTab, setActiveTab] = useState('products')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prodRes, ordRes, emailRes] = await Promise.all([
        fetch('/api/flash-products?showAll=true'),
        fetch('/api/flash-orders'),
        fetch('/api/promotional-emails'),
      ])
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        if (Array.isArray(prodData)) setProducts(prodData)
      }
      if (ordRes.ok) {
        const ordData = await ordRes.json()
        if (Array.isArray(ordData)) setOrders(ordData)
      }
      if (emailRes.ok) {
        const emailData = await emailRes.json()
        if (Array.isArray(emailData)) setPromotionalEmails(emailData)
      }
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
            <Package className="w-5 h-5 text-orange-500" />
            Vente Flash
          </h2>
          <p className="text-sm" style={{ color: 'var(--cc-text-secondary)' }}>Gérez vos produits et commandes flash</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          style={{ borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-secondary)' }}
          className="hover:opacity-80"
          onClick={loadData}
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
          <TabsTrigger value="products" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-1" /> Produits ({products.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <ShoppingCart className="w-4 h-4 mr-1" /> Commandes ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-1" /> Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <AdminProductsTab products={products} onRefresh={loadData} loading={loading} />
        </TabsContent>

        <TabsContent value="orders">
          <AdminOrdersTab orders={orders} onRefresh={loadData} loading={loading} />
        </TabsContent>

        <TabsContent value="stats">
          <AdminStatsTab
            orders={orders}
            products={products}
            promotionalEmails={promotionalEmails}
            onRefresh={loadData}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ==========================================
// Products Sub-Tab
// ==========================================
function AdminProductsTab({ products, onRefresh, loading }: { products: FlashProduct[]; onRefresh: () => void; loading: boolean }) {
  const [editingProduct, setEditingProduct] = useState<FlashProduct | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [category, setCategory] = useState('general')
  const [stock, setStock] = useState('-1')
  const [position, setPosition] = useState('0')
  const [description, setDescription] = useState('')
  const [saleEndsAt, setSaleEndsAt] = useState('')
  const [featured, setFeatured] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [shareProductId, setShareProductId] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setPrice('')
    setOriginalPrice('')
    setCategory('general')
    setStock('-1')
    setPosition('0')
    setDescription('')
    setSaleEndsAt('')
    setFeatured(false)
    setImageUrls([])
    setEditingProduct(null)
  }

  const startEdit = (product: FlashProduct) => {
    setEditingProduct(product)
    setName(product.name)
    setPrice(String(product.price))
    setOriginalPrice(String(product.originalPrice))
    setCategory(product.category)
    setStock(String(product.stock))
    setPosition(String(product.position))
    setDescription(product.description)
    setSaleEndsAt(product.saleEndsAt ? new Date(product.saleEndsAt).toISOString().slice(0, 16) : '')
    setFeatured(product.featured)
    setImageUrls(product.images ? product.images.split(',').filter(Boolean) : [])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (imageUrls.length + files.length > 5) {
      toast.error('Maximum 5 images autorisées')
      return
    }

    setUploading(true)
    try {
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('folder', 'flash')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (res.ok && data.url) {
          newUrls.push(data.url)
        } else {
          toast.error(`Erreur lors de l'upload de ${files[i].name}`)
        }
      }
      setImageUrls(prev => [...prev, ...newUrls])
      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} image(s) ajoutée(s)`)
      }
    } catch {
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price) {
      toast.error('Nom et prix requis')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name,
        price,
        originalPrice: originalPrice || '0',
        category,
        stock,
        position,
        description,
        saleEndsAt: saleEndsAt || null,
        featured,
        images: imageUrls.join(','),
      }

      if (editingProduct) {
        // Update
        const res = await fetch('/api/flash-products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        })
        if (res.ok) {
          const data = await res.json()
          toast.success('Produit modifié !')
          setShareProductId(data.id || editingProduct.id)
          resetForm()
          onRefresh()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Erreur')
        }
      } else {
        // Create
        const res = await fetch('/api/flash-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const data = await res.json()
          toast.success('Produit ajouté !')
          setShareProductId(data.id || null)
          resetForm()
          onRefresh()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Erreur')
        }
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/flash-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      if (res.ok) {
        toast.success(active ? 'Produit désactivé' : 'Produit activé')
        onRefresh()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/flash-products?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Produit supprimé')
        onRefresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Product Form */}
      <Card style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }} className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
            {editingProduct ? (
              <Pencil className="w-5 h-5 text-orange-400" />
            ) : (
              <Plus className="w-5 h-5 text-orange-500" />
            )}
            {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Nom du produit *</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nom du produit"
                  required
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Prix (FCFA) *</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="5000"
                  required
                  min={1}
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Prix original (FCFA)</Label>
                <Input
                  type="number"
                  value={originalPrice}
                  onChange={e => setOriginalPrice(e.target.value)}
                  placeholder="8000"
                  min={0}
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="electronics">Électronique</SelectItem>
                    <SelectItem value="fashion">Mode</SelectItem>
                    <SelectItem value="phone">Téléphone</SelectItem>
                    <SelectItem value="food">Alimentation</SelectItem>
                    <SelectItem value="beauty">Beauté</SelectItem>
                    <SelectItem value="home">Maison</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Stock (-1 = illimité)</Label>
                <Input
                  type="number"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  placeholder="-1"
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Position</Label>
                <Input
                  type="number"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="0"
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label style={{ color: 'var(--cc-text-secondary)' }}>Images (max 5)</Label>
              <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-20 h-20 rounded-lg object-cover object-center"
                      style={{ border: '1px solid var(--cc-border-subtle)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {imageUrls.length < 5 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors" style={{ borderColor: 'var(--cc-border-subtle)' }}>
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 opacity-50" style={{ color: 'var(--cc-text-secondary)' }} />
                        <span className="text-[9px] mt-1 opacity-50" style={{ color: 'var(--cc-text-secondary)' }}>Ajouter</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label style={{ color: 'var(--cc-text-secondary)' }}>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description du produit..."
                rows={3}
                className="resize-none"
                style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
              />
            </div>

            {/* Sale end date & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: 'var(--cc-text-secondary)' }}>Date de fin de vente</Label>
                <Input
                  type="datetime-local"
                  value={saleEndsAt}
                  onChange={e => setSaleEndsAt(e.target.value)}
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-orange-500"
                  style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)' }}
                />
                <Label htmlFor="featured" className="cursor-pointer" style={{ color: 'var(--cc-text-secondary)' }}>
                  Produit mis en avant (Featured)
                </Label>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-3">
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                disabled={saving || uploading}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Enregistrement...</>
                ) : editingProduct ? (
                  <><Save className="w-4 h-4 mr-1" /> Enregistrer</>
                ) : (
                  <><Plus className="w-4 h-4 mr-1" /> Ajouter le produit</>
                )}
              </Button>
              {editingProduct && (
                <Button
                  type="button"
                  variant="outline"
                  style={{ borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-secondary)' }}
                  onClick={resetForm}
                >
                  <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Shareable Link Section - shown after product creation/update */}
      {shareProductId && (
        <Card style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }} className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-sm" style={{ color: 'var(--cc-text-primary)' }}>Lien de partage</h3>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/#flash-${shareProductId}`}
                className="text-sm font-mono"
                style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                onClick={() => {
                  const link = `${window.location.origin}/#flash-${shareProductId}`
                  navigator.clipboard.writeText(link)
                  toast.success('Lien copié !')
                }}
              >
                <Link className="w-4 h-4 mr-1" /> Copier
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const shareLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/#flash-${shareProductId}`
                const shareProduct = products.find(p => p.id === shareProductId)
                const shareText = `Check this flash deal on CLASS CENTER: ${shareProduct?.name || 'Produit'} - ${shareProduct ? formatCurrency(shareProduct.price) : ''} FCFA`
                return (
                  <>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareLink}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                    >
                      WhatsApp
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                      Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                    >
                      Twitter
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      style={{ borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-secondary)' }}
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink)
                        toast.success('Lien copié !')
                      }}
                    >
                      <Link className="w-3.5 h-3.5 mr-1" /> Copier le lien
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--cc-text-secondary)' }}
                      onClick={() => setShareProductId(null)}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Fermer
                    </Button>
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <Card style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }} className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base" style={{ color: 'var(--cc-text-primary)' }}>
            Produits ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 opacity-30 mx-auto mb-3" style={{ color: 'var(--cc-text-secondary)' }} />
              <p style={{ color: 'var(--cc-text-secondary)' }}>Aucun produit. Ajoutez-en un ci-dessus.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {products.map(product => {
                  const images = product.images ? product.images.split(',').filter(Boolean) : []
                  const discount = product.originalPrice > 0
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0

                  return (
                    <div
                      key={product.id}
                      className="flex items-start gap-4 p-4 rounded-xl border transition-colors"
                      style={{
                        borderColor: product.active ? 'var(--cc-border-subtle)' : 'rgba(128,128,128,0.1)',
                        backgroundColor: product.active ? 'var(--cc-surface-container-high)' : 'transparent',
                        opacity: product.active ? 1 : 0.6,
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--cc-border-subtle)' }}>
                        {images[0] ? (
                          <img
                            src={images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 opacity-30" style={{ color: 'var(--cc-text-secondary)' }} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--cc-text-primary)' }}>{product.name}</p>
                          <Badge className={`text-[10px] ${CATEGORY_COLORS[product.category] || CATEGORY_COLORS.other}`}>
                            {CATEGORY_LABELS[product.category] || product.category}
                          </Badge>
                          {discount > 0 && (
                            <Badge className="text-[10px] bg-red-500/20 text-red-400">
                              -{discount}%
                            </Badge>
                          )}
                          {product.featured && (
                            <Badge className="text-[10px] bg-orange-500/20 text-orange-400">
                              Featured
                            </Badge>
                          )}
                          {!product.active && (
                            <Badge className="text-[10px] bg-white/10" style={{ color: 'var(--cc-text-secondary)' }}>
                              Inactif
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-bold text-sm" style={{ color: 'var(--cc-text-primary)' }}>{formatCurrency(product.price)}</span>
                          {product.originalPrice > 0 && (
                            <span className="text-xs line-through" style={{ color: 'var(--cc-text-secondary)' }}>{formatCurrency(product.originalPrice)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--cc-text-secondary)' }}>
                          <span>{product.stock === -1 ? 'Illimité' : `${product.stock} en stock`}</span>
                          <span>•</span>
                          <span>{product._count?.orders || 0} commande{(product._count?.orders || 0) !== 1 ? 's' : ''}</span>
                          {product.saleEndsAt && (
                            <>
                              <span>•</span>
                              <span className={new Date(product.saleEndsAt) < new Date() ? 'text-red-400' : 'text-green-400'}>
                                {new Date(product.saleEndsAt) < new Date() ? 'Expiré' : 'En cours'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-sky-400 hover:bg-sky-500/10"
                          onClick={() => {
                            const link = `${window.location.origin}/#flash-${product.id}`
                            navigator.clipboard.writeText(link)
                            toast.success('Lien de partage copié !')
                          }}
                          title="Partager"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${product.active ? 'text-green-400 hover:bg-green-500/10' : 'hover:opacity-80'}`}
                          style={!product.active ? { color: 'var(--cc-text-secondary)' } : undefined}
                          onClick={() => handleToggleActive(product.id, product.active)}
                          title={product.active ? 'Désactiver' : 'Activer'}
                        >
                          {product.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-orange-400 hover:bg-orange-500/10"
                          onClick={() => startEdit(product)}
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          title="Supprimer"
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Orders Sub-Tab
// ==========================================
function AdminOrdersTab({ orders, onRefresh, loading }: { orders: FlashOrder[]; onRefresh: () => void; loading: boolean }) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const stats = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/flash-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Commande mise à jour : ${STATUS_LABELS[status] || status}`)
        onRefresh()
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/flash-orders?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Commande supprimée')
        onRefresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingId(null)
    }
  }

  const statCards = [
    { label: 'En attente', value: stats.pending, icon: ShoppingCart, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Confirmées', value: stats.confirmed, icon: Check, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Expédiées', value: stats.shipped, icon: Truck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Livrées', value: stats.delivered, icon: Package, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <span className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>{card.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--cc-text-primary)' }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Orders List */}
      <Card style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }} className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base" style={{ color: 'var(--cc-text-primary)' }}>Commandes ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 opacity-30 mx-auto mb-3" style={{ color: 'var(--cc-text-secondary)' }} />
              <p style={{ color: 'var(--cc-text-secondary)' }}>Aucune commande</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3">
                {orders.map(order => {
                  const productImages = order.product?.images ? order.product.images.split(',').filter(Boolean) : []

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl"
                      style={{ border: '1px solid var(--cc-border-subtle)', backgroundColor: 'var(--cc-surface-container-high)' }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, var(--cc-surface-container-high) 0%, var(--cc-surface-container) 70%)', border: '1px solid var(--cc-border-subtle)' }}>
                          {productImages[0] ? (
                            <img
                              src={productImages[0]}
                              alt={order.product?.name}
                              className="max-w-full max-h-full object-contain object-center"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 opacity-30" style={{ color: 'var(--cc-text-secondary)' }} />
                            </div>
                          )}
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm truncate" style={{ color: 'var(--cc-text-primary)' }}>
                              {order.product?.name || 'Produit supprimé'}
                            </p>
                            <Badge className={`text-[10px] ${STATUS_COLORS[order.status] || 'bg-white/10'}`} style={!STATUS_COLORS[order.status] ? { color: 'var(--cc-text-secondary)' } : undefined}>
                              {STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </div>

                          <div className="mt-1 text-xs space-y-0.5" style={{ color: 'var(--cc-text-secondary)' }}>
                            <p>
                              <span style={{ color: 'var(--cc-text-primary)', opacity: 0.7 }}>Client:</span> {order.clientName} — {order.clientPhone}
                            </p>
                            {(order.deliveryAddress || order.deliveryCity) && (
                              <p>
                                <span style={{ color: 'var(--cc-text-primary)', opacity: 0.7 }}>Livraison:</span> {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                              </p>
                            )}
                            <div className="flex items-center gap-3">
                              <span>
                                <span style={{ color: 'var(--cc-text-primary)', opacity: 0.7 }}>Qté:</span> {order.quantity}
                              </span>
                              <span className="font-bold" style={{ color: 'var(--cc-text-primary)' }}>{formatCurrency(order.amount)}</span>
                            </div>
                            {order.note && (
                              <p className="text-orange-400/80 italic">Note: {order.note}</p>
                            )}
                            <p>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={order.status}
                            onValueChange={(val) => handleStatusChange(order.id, val)}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
                              <SelectItem value="PENDING">En attente</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                              <SelectItem value="SHIPPED">Expédiée</SelectItem>
                              <SelectItem value="DELIVERED">Livrée</SelectItem>
                              <SelectItem value="CANCELLED">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDelete(order.id)}
                            disabled={deletingId === order.id}
                            title="Supprimer"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// Statistics Sub-Tab (Statistiques)
// ==========================================
function AdminStatsTab({
  orders,
  products,
  promotionalEmails,
  onRefresh,
  loading,
}: {
  orders: FlashOrder[]
  products: FlashProduct[]
  promotionalEmails: PromotionalEmail[]
  onRefresh: () => void
  loading: boolean
}) {
  // ===== Part 1: Sales Dashboard =====
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED')
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.amount, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? Math.round(orders.reduce((sum, o) => sum + o.amount, 0) / totalOrders) : 0

  const ordersByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const status of ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
      counts[status] = orders.filter(o => o.status === status).length
    }
    return counts
  }, [orders])

  // Revenue by day (last 7 days)
  const revenueByDay = useMemo(() => {
    const days: { label: string; revenue: number; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        return orderDate >= dayStart && orderDate < dayEnd
      })

      days.push({
        label: dayStr,
        revenue: dayOrders.reduce((sum, o) => sum + o.amount, 0),
        count: dayOrders.length,
      })
    }
    return days
  }, [orders])

  const maxDayRevenue = Math.max(...revenueByDay.map(d => d.revenue), 1)

  // Top selling products
  const topProducts = useMemo(() => {
    const productCounts: Record<string, { name: string; count: number; revenue: number }> = {}
    for (const order of orders) {
      if (!productCounts[order.productId]) {
        productCounts[order.productId] = {
          name: order.product?.name || 'Produit supprimé',
          count: 0,
          revenue: 0,
        }
      }
      productCounts[order.productId].count += order.quantity
      productCounts[order.productId].revenue += order.amount
    }
    return Object.entries(productCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
  }, [orders])

  // ===== Part 2: Email Capture =====
  const [emailSearch, setEmailSearch] = useState('')
  const [emailSourceFilter, setEmailSourceFilter] = useState('all')
  const [newEmail, setNewEmail] = useState('')
  const [newEmailName, setNewEmailName] = useState('')
  const [addingEmail, setAddingEmail] = useState(false)
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null)

  const filteredEmails = useMemo(() => {
    return promotionalEmails.filter(e => {
      const matchesSearch = emailSearch
        ? e.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
          e.name.toLowerCase().includes(emailSearch.toLowerCase())
        : true
      const matchesSource = emailSourceFilter === 'all' ? true : e.source === emailSourceFilter
      return matchesSearch && matchesSource
    })
  }, [promotionalEmails, emailSearch, emailSourceFilter])

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) {
      toast.error('Email requis')
      return
    }
    setAddingEmail(true)
    try {
      const res = await fetch('/api/promotional-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newEmailName, source: 'MANUAL' }),
      })
      if (res.ok) {
        toast.success('Email ajouté !')
        setNewEmail('')
        setNewEmailName('')
        onRefresh()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setAddingEmail(false)
    }
  }

  const handleDeleteEmail = async (id: string) => {
    setDeletingEmailId(id)
    try {
      const res = await fetch(`/api/promotional-emails?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Email supprimé')
        onRefresh()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur')
    } finally {
      setDeletingEmailId(null)
    }
  }

  const handleExportCSV = () => {
    const emailsToExport = filteredEmails.length > 0 ? filteredEmails : promotionalEmails
    const csvContent = emailsToExport.map(e => e.email).join(',')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emails-promo-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${emailsToExport.length} email(s) exporté(s)`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ========================================
          PART 1: Point des Ventes (Sales Dashboard)
          ======================================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
          <TrendingUp className="w-5 h-5 text-orange-500" />
          Point des Ventes
        </h3>

        {/* Revenue & Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>Revenu total</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--cc-text-primary)' }}>{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--cc-text-secondary)' }}>Commandes livrées</p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>Total commandes</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--cc-text-primary)' }}>{totalOrders}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--cc-text-secondary)' }}>Tous statuts confondus</p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>Panier moyen</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--cc-text-primary)' }}>{formatCurrency(avgOrderValue)}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--cc-text-secondary)' }}>Montant moyen / commande</p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs" style={{ color: 'var(--cc-text-secondary)' }}>Produits actifs</span>
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--cc-text-primary)' }}>{products.filter(p => p.active).length}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--cc-text-secondary)' }}>Sur {products.length} produits</p>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
            <Calendar className="w-4 h-4" style={{ color: 'var(--cc-text-secondary)' }} />
            Commandes par statut
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--cc-surface-container-high)' }}>
                <p className="text-lg font-bold" style={{ color: 'var(--cc-text-primary)' }}>{count}</p>
                <Badge className={`text-[9px] ${STATUS_COLORS[status] || ''}`}>
                  {STATUS_LABELS[status] || status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart - Last 7 Days */}
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--cc-text-secondary)' }} />
            Revenus des 7 derniers jours
          </h4>
          <div className="flex items-end gap-2 h-40">
            {revenueByDay.map((day, index) => {
              const heightPercent = maxDayRevenue > 0 ? (day.revenue / maxDayRevenue) * 100 : 0
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--cc-text-primary)' }}>
                    {day.revenue > 0 ? formatCurrency(day.revenue) : '-'}
                  </span>
                  <div className="w-full relative" style={{ height: '100px' }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-md transition-all duration-300"
                      style={{
                        height: `${Math.max(heightPercent, 2)}%`,
                        background: day.revenue > 0
                          ? 'linear-gradient(to top, #f97316, #fb923c)'
                          : 'var(--cc-border-subtle)',
                        minHeight: '4px',
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--cc-text-secondary)' }}>{day.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
            <ArrowUpRight className="w-4 h-4 text-green-400" />
            Top produits vendus
          </h4>
          {topProducts.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--cc-text-secondary)' }}>Aucune vente pour le moment</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map(([id, data], index) => {
                const maxCount = topProducts[0]?.[1].count || 1
                const widthPercent = (data.count / maxCount) * 100
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--cc-text-secondary)' }}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm truncate" style={{ color: 'var(--cc-text-primary)' }}>{data.name}</span>
                        <span className="text-xs font-medium ml-2 flex-shrink-0" style={{ color: 'var(--cc-text-secondary)' }}>
                          {data.count} vente{data.count !== 1 ? 's' : ''} • {formatCurrency(data.revenue)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--cc-surface-container-high)' }}>
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ width: `${widthPercent}%`, background: 'linear-gradient(to right, #f97316, #fb923c)' }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================
          PART 2: Email Capture for Promotions
          ======================================== */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
          <Mail className="w-5 h-5 text-blue-500" />
          Capture d&apos;emails promotionnels
        </h3>

        {/* Email Stats & Add Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Stats card */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--cc-text-primary)' }}>Emails capturés</span>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--cc-text-primary)' }}>{promotionalEmails.length}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {['FLASH_ORDER', 'NEWSLETTER', 'MANUAL'].map(source => {
                const count = promotionalEmails.filter(e => e.source === source).length
                return (
                  <Badge key={source} className={`text-[9px] ${SOURCE_COLORS[source]}`}>
                    {SOURCE_LABELS[source]}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>

          {/* Add email form */}
          <div className="lg:col-span-2 rounded-xl p-4" style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--cc-text-primary)' }}>
              <Plus className="w-4 h-4 text-orange-400" />
              Ajouter un email manuellement
            </h4>
            <form onSubmit={handleAddEmail} className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="flex-1"
                style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
              />
              <Input
                placeholder="Nom (optionnel)"
                value={newEmailName}
                onChange={e => setNewEmailName(e.target.value)}
                className="sm:w-40"
                style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                disabled={addingEmail}
              >
                {addingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span className="ml-1">Ajouter</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Filter & Export Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--cc-text-secondary)' }} />
            <Input
              placeholder="Rechercher un email..."
              value={emailSearch}
              onChange={e => setEmailSearch(e.target.value)}
              className="pl-9"
              style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}
            />
          </div>
          <Select value={emailSourceFilter} onValueChange={setEmailSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" style={{ backgroundColor: 'var(--cc-surface-container-high)', borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-primary)' }}>
              <SelectValue placeholder="Filtrer par source" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }}>
              <SelectItem value="all">Toutes les sources</SelectItem>
              <SelectItem value="FLASH_ORDER">Commande Flash</SelectItem>
              <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
              <SelectItem value="MANUAL">Manuel</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={promotionalEmails.length === 0}
            style={{ borderColor: 'var(--cc-border-subtle)', color: 'var(--cc-text-secondary)' }}
          >
            <Download className="w-4 h-4 mr-1" /> Exporter CSV
          </Button>
        </div>

        {/* Emails List */}
        <Card style={{ backgroundColor: 'var(--cc-surface-container)', border: '1px solid var(--cc-border-subtle)' }} className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base" style={{ color: 'var(--cc-text-primary)' }}>
              Emails ({filteredEmails.length}{emailSourceFilter !== 'all' || emailSearch ? ' filtrés' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEmails.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 opacity-30 mx-auto mb-3" style={{ color: 'var(--cc-text-secondary)' }} />
                <p style={{ color: 'var(--cc-text-secondary)' }}>
                  {promotionalEmails.length === 0
                    ? 'Aucun email capturé. Ajoutez-en un ci-dessus.'
                    : 'Aucun résultat pour cette recherche.'}
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                <div className="space-y-2">
                  {filteredEmails.map(email => (
                    <div
                      key={email.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--cc-surface-container-high)', border: '1px solid var(--cc-border-subtle)' }}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--cc-text-primary)' }}>
                            {email.name || email.email}
                          </span>
                          {email.name && (
                            <span className="text-xs truncate" style={{ color: 'var(--cc-text-secondary)' }}>
                              {email.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`text-[9px] ${SOURCE_COLORS[email.source] || ''}`}>
                            {SOURCE_LABELS[email.source] || email.source}
                          </Badge>
                          <span className="text-[10px]" style={{ color: 'var(--cc-text-secondary)' }}>
                            {new Date(email.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10 flex-shrink-0"
                        onClick={() => handleDeleteEmail(email.id)}
                        disabled={deletingEmailId === email.id}
                        title="Supprimer"
                      >
                        {deletingEmailId === email.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
