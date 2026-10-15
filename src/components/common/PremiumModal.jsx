import PremiumContent from './PremiumContent'

export default function PremiumModal({ isOpen, onClose }) {
  return <PremiumContent variant="modal" isOpen={isOpen} onClose={onClose} />
}
