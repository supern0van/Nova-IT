import { redirect } from 'next/navigation'

export default function NyBokningSida() {
  redirect('/portal/bokningar?ny=1')
}
