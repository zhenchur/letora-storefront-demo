import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)
// Lenis and all site motion share one clock without scroll lag compensation.
gsap.ticker.lagSmoothing(0)

export { gsap, useGSAP, ScrollTrigger, SplitText }
