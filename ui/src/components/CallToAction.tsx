import { AppStoreLink } from '@/components/AppStoreLink'
import { CircleBackground } from '@/components/CircleBackground'
import { Container } from '@/components/Container'
import { Button } from './Button'

export function CallToAction() {
  return (
    <section
      id="get-free-shares-today"
      className="relative overflow-hidden bg-gray-900 py-20 sm:py-28"
    >
      <div className="absolute left-20 top-1/2 -translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2">
        <CircleBackground color="#fff" className="animate-spin-slower" />
      </div>
      <Container className="relative">
        <div className="mx-auto max-w-md sm:text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Get your first notifications today
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            It takes 15 seconds to sign up. Enter /register to get started today.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="https://discord.com/oauth2/authorize?client_id=1165831512281849876&permissions=8&scope=bot%20applications.commands" className="hidden hover:bg-white hover:text-black lg:block">
              Add bot to Discord
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
