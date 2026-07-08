'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft } from 'lucide-react'
import { WHATSAPP_NUMBER } from '@/lib/constants'

// ==========================================
// LEGAL CONTENT DATA
// ==========================================
const LEGAL_CONTENT: Record<string, { title: string; content: React.ReactNode }> = {
  privacy: {
    title: 'Politique de confidentialité',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Collecte de données</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Nom complet et numéro de téléphone pour le traitement des commandes</li>
            <li>Informations de paiement (Wave, Djamo) nécessaires aux transactions</li>
            <li>Adresse de livraison pour les produits physiques (Vente Flash)</li>
            <li>Adresse e-mail pour la newsletter et les communications (optionnel)</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Utilisation des données</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Traitement et suivi de vos commandes (recharges, souscriptions, cartes)</li>
            <li>Amélioration continue de nos services et de votre expérience utilisateur</li>
            <li>Envoi de notifications liées à vos commandes en cours</li>
            <li>Communications promotionnelles avec votre consentement préalable</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Protection des données</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Transactions sécurisées via les plateformes officielles Wave et Djamo</li>
            <li>Aucune donnée bancaire n&apos;est stockée sur nos serveurs</li>
            <li>Accès restreint aux données personnelles, uniquement par le personnel autorisé</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Partage des données</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Aucun partage de vos données personnelles à des tiers sans votre consentement explicite</li>
            <li>Les données de paiement sont traitées directement par les plateformes de paiement sécurisées</li>
            <li>Données partagées uniquement si requis par la loi en vigueur</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Cookies et technologies similaires</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Utilisation de cookies essentiels au bon fonctionnement du site</li>
            <li>Cookies d&apos;analyse pour comprendre l&apos;utilisation du site et améliorer nos services</li>
            <li>Vous pouvez désactiver les cookies dans les paramètres de votre navigateur</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Droits des utilisateurs</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li><strong>Droit d&apos;accès</strong> — Consultez les données personnelles que nous détenons</li>
            <li><strong>Droit de modification</strong> — Corrigez vos informations à tout moment</li>
            <li><strong>Droit de suppression</strong> — Demandez la suppression de vos données personnelles</li>
            <li><strong>Droit d&apos;opposition</strong> — Refusez le traitement de vos données à des fins marketing</li>
          </ul>
        </div>
        <div className="p-4 bg-cc-surface-container rounded-xl border border-cc-border">
          <p className="text-sm text-cc-text-secondary">
            Contact : <a href="mailto:classcenter.ci@gmail.com" className="text-cc-orange hover:underline font-medium">classcenter.ci@gmail.com</a>
          </p>
        </div>
      </div>
    ),
  },
  returns: {
    title: 'Politique de non-retour',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Produits numériques (recharges et souscriptions)</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Les recharges et souscriptions sont livrées instantanément par code ou crédit direct</li>
            <li><strong>Aucun retour possible</strong> une fois le produit livré et le code communiqué</li>
            <li>La livraison est considérée comme effective dès l&apos;envoi du code par WhatsApp ou SMS</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Vente Flash — Produits physiques</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Paiement à la livraison uniquement (aucun paiement anticipé requis)</li>
            <li><strong>Aucun retour possible</strong> après confirmation de la livraison par le client</li>
            <li>Vérifiez soigneusement votre commande lors de la réception avant de confirmer</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Produits défectueux</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Remplacement possible dans les <strong>48 heures</strong> suivant la livraison</li>
            <li>Preuve obligatoire : photo ou vidéo du défaut envoyée via WhatsApp</li>
            <li>Le remplacement est effectué après validation par notre équipe</li>
            <li>Aucun remboursement, uniquement un échange contre un produit identique</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Annulation de commande</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>L&apos;annulation est possible <strong>uniquement avant l&apos;expédition</strong> du produit</li>
            <li>Pour les produits numériques : annulation impossible une fois le code généré</li>
            <li>Contactez-nous rapidement via WhatsApp pour toute demande d&apos;annulation</li>
          </ul>
        </div>
        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
          <p className="text-xs text-cc-text-secondary">
            Important : La politique de non-retour s&apos;applique à tous les produits numériques et physiques vendus sur CLASS CENTER, conformément aux lois de consommation applicables en Côte d&apos;Ivoire.
          </p>
        </div>
      </div>
    ),
  },
  terms: {
    title: 'Conditions générales de vente',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Acceptation des conditions</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Toute commande passée sur CLASS CENTER implique l&apos;acceptation pleine et entière des présentes conditions</li>
            <li>Ces conditions prévalent sur tout autre document ou accord antérieur</li>
            <li>CLASS CENTER se réserve le droit de modifier les CGV à tout moment</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Prix et paiement</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Tous les prix sont indiqués en FCFA (Franc CFA)</li>
            <li>Moyens de paiement acceptés : <strong>Wave</strong> (via ordinateur) et <strong>Djamo</strong> (via smartphone)</li>
            <li>Le paiement est requis avant la livraison des produits numériques (recharges, souscriptions)</li>
            <li>Pour les produits physiques (Vente Flash) : paiement à la livraison uniquement</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Livraison</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li><strong>Produits numériques</strong> : livraison instantanée par WhatsApp ou SMS</li>
            <li><strong>Produits physiques</strong> : livraison à domicile avec paiement à la livraison</li>
            <li>Délai de livraison indicatif : 24h à 72h selon la zone géographique (Abidjan et environs)</li>
            <li>Le client doit vérifier le produit lors de la livraison avant confirmation</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Responsabilité</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>CLASS CENTER s&apos;engage à fournir les produits et services commandés dans les meilleurs délais</li>
            <li>En cas d&apos;indisponibilité, le client sera informé et pourra choisir entre un remboursement ou un produit équivalent</li>
            <li>CLASS CENTER ne saurait être tenu responsable des retards dus à des cas de force majeure</li>
            <li>La responsabilité de CLASS CENTER est limitée au montant de la commande</li>
          </ul>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Droit applicable</h3>
          <ul className="text-sm text-cc-text-secondary space-y-1.5 list-disc pl-5">
            <li>Les présentes conditions sont régies par le droit <strong>ivoirien</strong></li>
            <li>Tout litige sera soumis aux tribunaux compétents d&apos;Abidjan, Côte d&apos;Ivoire</li>
            <li>La langue de référence pour le règlement des litiges est le français</li>
          </ul>
        </div>
      </div>
    ),
  },
  legal: {
    title: 'Mentions légales',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Éditeur du site</h3>
          <div className="text-sm text-cc-text-secondary space-y-1.5">
            <p>Dénomination : <strong className="text-cc-text-primary">CLASS CENTER</strong></p>
            <p>Statut : Entreprise individuelle</p>
            <p>Siège social : Abidjan, Côte d&apos;Ivoire</p>
          </div>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Contact</h3>
          <div className="text-sm text-cc-text-secondary space-y-1.5">
            <p>WhatsApp : <a href={`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="text-cc-orange hover:underline font-medium">{WHATSAPP_NUMBER}</a></p>
            <p>E-mail : <a href="mailto:classcenter.ci@gmail.com" className="text-cc-orange hover:underline font-medium">classcenter.ci@gmail.com</a></p>
          </div>
        </div>
        <Separator className="bg-cc-border" />
        <div>
          <h3 className="text-lg font-bold text-cc-text-primary mb-2">Hébergement</h3>
          <div className="text-sm text-cc-text-secondary space-y-1.5">
            <p>Plateforme : Vercel Inc.</p>
            <p>Adresse : 440 N Barranca Ave, Covina, CA 91723, USA</p>
          </div>
        </div>
        <div className="p-4 bg-cc-surface-container rounded-xl border border-cc-border">
          <p className="text-xs text-cc-text-secondary">
            Le site CLASS CENTER est la propriété exclusive de CLASS CENTER. Toute reproduction, même partielle, du contenu de ce site est interdite sans autorisation préalable écrite.
          </p>
        </div>
      </div>
    ),
  },
}

// ==========================================
// LEGAL PAGE COMPONENT
// ==========================================
export function LegalPage({ page }: { page: string }) {
  const content = LEGAL_CONTENT[page]

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cc-page-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cc-text-primary mb-4">Page non trouvée</h1>
          <p className="text-cc-text-secondary">La page demandée n&apos;existe pas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cc-page-bg pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-cc-text-secondary hover:text-cc-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-cc-text-primary mb-8">
          {content.title}
        </h1>

        {/* Content */}
        <div className="bg-cc-surface-container border border-cc-border rounded-2xl p-6 sm:p-8">
          {content.content}
        </div>

        {/* Footer spacing */}
        <div className="h-12" />
      </div>
    </div>
  )
}
