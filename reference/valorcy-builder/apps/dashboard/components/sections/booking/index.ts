import type { SectionDefinition } from '@/components/sections/registry.types'
import { bookingAppointmentSection } from '@/components/sections/booking/booking-appointment'
import { bookingClassScheduleSection } from '@/components/sections/booking/booking-class-schedule'
import { bookingConsultationSection } from '@/components/sections/booking/booking-consultation'
import { bookingConsultationLegalSection } from '@/components/sections/booking/booking-consultation-legal'
import { bookingTravelInquirySection } from '@/components/sections/booking/booking-travel-inquiry'
import { bookingRestaurantSection } from '@/components/sections/booking/booking-restaurant'
import { bookingDemoSection } from '@/components/sections/booking/booking-demo'
import { bookingCallSection } from '@/components/sections/booking/booking-call'
import { bookingWaitlistSection } from '@/components/sections/booking/booking-waitlist'
import { bookingServiceMenuSection } from '@/components/sections/booking/booking-service-menu'
import { bookingPackageSection } from '@/components/sections/booking/booking-package'
import { bookingEventTicketsSection } from '@/components/sections/booking/booking-event-tickets'
import { bookingHotelSection } from '@/components/sections/booking/booking-hotel'
import { bookingFitnessTrialSection } from '@/components/sections/booking/booking-fitness-trial'
import { bookingMedicalSection } from '@/components/sections/booking/booking-medical'
import { bookingOnlineCourseSection } from '@/components/sections/booking/booking-online-course'
import { bookingPhotographySection } from '@/components/sections/booking/booking-photography'
import { bookingPropertyTourSection } from '@/components/sections/booking/booking-property-tour'
import { bookingWeddingSection } from '@/components/sections/booking/booking-wedding'
import { bookingRentalCarSection } from '@/components/sections/booking/booking-rental-car'

export const BOOKING_SECTION_DEFINITIONS: SectionDefinition[] = [
  bookingAppointmentSection,
  bookingClassScheduleSection,
  bookingConsultationSection,
  bookingConsultationLegalSection,
  bookingTravelInquirySection,
  bookingRestaurantSection,
  bookingDemoSection,
  bookingCallSection,
  bookingWaitlistSection,
  bookingServiceMenuSection,
  bookingPackageSection,
  bookingEventTicketsSection,
  bookingHotelSection,
  bookingFitnessTrialSection,
  bookingMedicalSection,
  bookingOnlineCourseSection,
  bookingPhotographySection,
  bookingPropertyTourSection,
  bookingWeddingSection,
  bookingRentalCarSection,
]
