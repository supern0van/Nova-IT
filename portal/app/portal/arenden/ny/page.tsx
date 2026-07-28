import { redirect } from 'next/navigation'

export default function NyttArendeSida() {
  redirect('/portal/arenden?ny=1')
}
