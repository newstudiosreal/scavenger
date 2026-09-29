import { redirect } from 'next/navigation'

export default function Home() {
  // Reindirizza automaticamente l'utente alla pagina di gioco.
  // Se non è loggato, la pagina /gioca lo manderà automaticamente a /login.
  redirect('/gioca')
}
