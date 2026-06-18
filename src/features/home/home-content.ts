import type { StepItem } from '@/features/home/home.types'

/** Hero / brand (aligned with ma noula marketing tone) */
export const heroTagline =
  'Private bespoke care — connecting mothers with certified maternal wellness professionals.'

export const aboutHeading = 'About us'

export const aboutParagraphs: string[] = [
  'Manoula is building a trusted network of certified maternal wellness professionals — from lactation and postpartum doula care to therapy, pelvic floor support, and more.',
  'We are starting by listening: collecting what mothers need and how professionals want to work, so we can make thoughtful introductions when the network opens.',
]

export const footerTagline = 'Private bespoke midwifery care'

export const footerLocation =
  'Ma Noula Care, 3rd Floor, 86-90 Paul Street, London, EC2A 4NE'

export const footerEmail = 'Birthjourney@manoula.co.uk'

export const steps: StepItem[] = [
  {
    step: '1',
    title: 'Share your details',
    text: 'Tell us who you are, where you are, and what kind of support you are looking for — or, for professionals, how you practice.',
  },
  {
    step: '2',
    title: 'We review your needs',
    text: 'Our team reads every submission to understand fit, credentials, and location before making introductions.',
  },
  {
    step: '3',
    title: 'We reach out to connect you',
    text: 'When there is a strong match, we contact you directly to connect mothers with specialists — or professionals with families who need their care.',
  },
]
