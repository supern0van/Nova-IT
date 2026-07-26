import { redirect } from 'next/navigation'

export default function Hem() {
  // Sidskyddet i portalen skickar vidare till /logga-in om session saknas.
  redirect('/portal')
}
