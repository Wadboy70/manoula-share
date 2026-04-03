import type { SpecialtyItem, StepItem, TestimonialItem } from '@/types/home'

/** Hero / brand (aligned with ma noula marketing tone) */
export const heroTagline =
  'Private bespoke care — discover certified maternal wellness professionals tailored to you.'

export const aboutHeading = 'About us'

export const aboutParagraphs: string[] = [
  'At Manoula, we connect families with trusted midwifery-informed support and a network of certified maternal wellness professionals.',
  'Whether you are looking for advocacy through pregnancy and birth, calm preparation, or continuity from someone who knows your story, we are here to help you find the right care.',
  'We offer both in-person and virtual options so your support can meet you wherever you are.',
]

export const footerTagline = 'Private bespoke midwifery care'

export const footerLocation =
  'Ma Noula Care, 3rd Floor, 86-90 Paul Street, London, EC2A 4NE'

export const footerEmail = 'Birthjourney@manoula.co.uk'

export const specialties: SpecialtyItem[] = [
  {
    title: 'Lactation support',
    blurb: 'IBCLCs and counselors for feeding goals and comfort.',
  },
  {
    title: 'Postpartum doula care',
    blurb: 'Hands-on help at home so you can rest and recover.',
  },
  {
    title: 'Mental health & therapy',
    blurb: 'Licensed therapists who focus on the perinatal journey.',
  },
  {
    title: 'Pelvic floor & physical therapy',
    blurb: 'Specialists for recovery, strength, and pain relief.',
  },
  {
    title: 'Sleep & infant care',
    blurb: 'Guidance for safer sleep and more predictable nights.',
  },
  {
    title: 'Nutrition & wellness',
    blurb: 'Dietitians tailored to pregnancy and postpartum needs.',
  },
]

export const steps: StepItem[] = [
  {
    step: '1',
    title: 'Search or browse',
    text: 'Filter by specialty, availability, and what matters most to you.',
  },
  {
    step: '2',
    title: 'Read profiles & reviews',
    text: 'Compare bios, credentials, and community feedback in one place.',
  },
  {
    step: '3',
    title: 'Message & book',
    text: 'Reach out securely and schedule visits that fit your calendar.',
  },
  {
    step: '4',
    title: 'Stay supported',
    text: 'Manage ongoing care and follow-ups from your dashboard.',
  },
]

export const testimonials: TestimonialItem[] = [
  {
    quote:
      'My husband was my birth partner and Sade was my doula at the birth of my twins and thank God because Sade was the one that realised that my babies were coming before the midwife in charge! I was able to have my twins naturally and most importantly confidently with Sade advocating for me and being the extra set of eyes we needed through out the labour.',
    name: 'Raquel. A',
    detail: '',
  },
  {
    quote:
      "Sade was my midwife & birthing partner for my two pregnancies. She was an absolute angel sent from God. My first pregnancy was a twin pregnancy where I was 21 and going through a lot and she left her birthday celebration to assist and support me in labour. I'm LOVING that you're sharing your midwifery guidance with the world.",
    name: 'Jardinia',
    detail: '',
  },
  {
    quote:
      'I found a lactation consultant who actually listened. Booking took minutes.',
    name: 'Alex M.',
    detail: 'New parent',
  },
]
