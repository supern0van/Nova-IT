import { redirect } from 'next/navigation'

export default function NyKundSida() {
  redirect('/portal/kunder?ny=1')
}
