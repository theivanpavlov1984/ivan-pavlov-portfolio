import type { StaticImageData } from 'next/image'
import lazarev from '@/assets/avatars/ivan_lazarev.jpg'
import vanitsky from '@/assets/avatars/dmitry_vanitsky.jpeg'
import konoplitski from '@/assets/avatars/pavel_konoplitskiy.jpeg'
import howard from '@/assets/avatars/chris_howard.jpeg'

// LinkedIn recommendations, kept in the original English in both languages
export type Review = {
  name: string
  avatar: StaticImageData
  role: string // current headline, shown with "now"
  relation: 'managed' | 'senior'
  date: string
  quote: string
  labels: string[]
  full: string[]
}

export const reviews: Review[] = [
  {
    name: "Ivan Lazarev",
    avatar: lazarev,
    role: "Lead Designer @ VTB",
    relation: 'managed',
    date: "Jan 2026",
    quote: "He has a strong understanding of system-driven design, pays great attention to detail, and is able to translate abstract guidelines into well-structured, reusable components.",
    labels: ["design-system", "tokens", "components"],
    full: [
      "I had the opportunity to manage Ivan while we were working together on the company's design system and several product initiatives. Ivan played a key role in the hands-on development and evolution of the design system, including refining and maintaining UI components, introducing design tokens, and working with variables to ensure consistency and scalability across products.",
      "He has a strong understanding of system-driven design, pays great attention to detail, and is able to translate abstract guidelines into well-structured, reusable components. Ivan worked confidently with tokenization (colors, typography, spacing) and helped align design decisions with both product and engineering needs.",
      "Ivan is a reliable, technically strong UI/UX designer who is comfortable working in complex environments and collaborating closely with developers. I would gladly recommend him for roles involving design systems, product design, or large-scale UI work.",
    ],
  },
  {
    name: "Dmitry Vanitsky",
    avatar: vanitsky,
    role: "Associate Director, Experience Design @ EPAM",
    relation: 'senior',
    date: "Aug 2024",
    quote: "In terms of his Experience Design skills, Ivan consistently exceeded expectations. What truly sets Ivan apart is his insatiable drive for growth and learning.",
    labels: ["experience-design", "communication", "growth"],
    full: [
      "I had the pleasure of overseeing Ivan Pavlov's work as an Experience Designer for a year and a half, and I can confidently attest to his exceptional skills and professionalism.",
      "Ivan's communication abilities stand out as one of his strongest assets. Throughout our time working together, he consistently demonstrated polite and professional communication, fostering positive relationships with colleagues and clients alike.",
      "In terms of his Experience Design skills, Ivan consistently exceeded expectations. He approached every project with dedication and enthusiasm, consistently delivering work that was above and beyond what was required. His commitment to excellence was evident in the outstanding feedback he regularly received from customers.",
      "What truly sets Ivan apart is his insatiable drive for growth and learning. He consistently sought out opportunities to expand his knowledge and enhance his professional skills. This proactive approach to personal development not only benefited Ivan but also brought fresh perspectives and innovative ideas to our team.",
      "Ivan's combination of strong communication skills, design expertise, and commitment to continuous improvement makes him an invaluable asset to any team.",
    ],
  },
  {
    name: "Pavel Konoplitski",
    avatar: konoplitski,
    role: "Head of Design Türkiye (40+ designers)",
    relation: 'managed',
    date: "Jul 2023",
    quote: "Ivan's depth of knowledge in the UX/UI/Usability/CRO fields is truly impressive, surpassing general standards and templates.",
    labels: ["ux-audit", "cro", "e-commerce"],
    full: [
      "I am writing to enthusiastically recommend Ivan for any project or team that requires expertise in UX/UI, Usability, and Conversion Rate Optimization (CRO). I have had the pleasure of collaborating with Ivan on various e-commerce and lead generation projects over the past 2 years, and his contributions have been invaluable.",
      "Ivan's skill set encompasses a wide range of tasks, including auditing, prototyping, design, and consulting. His performance in these areas has consistently exceeded expectations. Ivan's depth of knowledge in the UX/UI/Usability/CRO fields is truly impressive, surpassing general standards and templates. His expertise goes beyond surface-level practices, allowing him to provide innovative and tailored solutions to unique challenges.",
    ],
  },
  {
    name: "Chris Howard",
    avatar: howard,
    role: "Open Source @ Uber",
    relation: 'managed',
    date: "Dec 2022",
    quote: "He works swiftly but never at the cost of quality and is able to flex and react to changes well.",
    labels: ["ux-ui", "speed", "quality"],
    full: [
      "Ivan is an incredibly skilled UX/UI designer who works efficiently with a professional and detailed lens. He works swiftly but never at the cost of quality and is able to flex and react to changes well. This quality sets him apart from other designers who may find such requests challenging.",
      "Ivan's awareness of the end-user focus and the industries for which he is designing is evident and reflected in his work. He is someone who I and my wider team rely upon for expert insight into design principles, trends and user interaction and is a key asset to any team.",
    ],
  },
]
