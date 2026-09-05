import * as yup from 'yup';

/**
 * Standard validation helper that extracts Yup ValidationError messages into an error dictionary
 */
export async function validateForm<T extends Record<string, any>>(
  schema: yup.ObjectSchema<any>,
  data: T
): Promise<{ isValid: boolean; errors: Record<string, string>; data?: T }> {
  try {
    const validated = await schema.validate(data, { abortEarly: false, stripUnknown: false });
    return { isValid: true, errors: {}, data: validated as T };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errorMap: Record<string, string> = {};
      err.inner.forEach((error) => {
        if (error.path && !errorMap[error.path]) {
          errorMap[error.path] = error.message;
        }
      });
      return { isValid: false, errors: errorMap };
    }
    return { isValid: false, errors: { form: 'An unexpected validation error occurred.' } };
  }
}

// 1. Auth: Login
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address (e.g. name@example.com)'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

// 2. Auth: Register
export const registerSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  email: yup
    .string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address (e.g. name@example.com)'),
  phone: yup
    .string()
    .trim()
    .required('WhatsApp / Phone number is required')
    .min(10, 'Phone number must be at least 10 digits'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  role: yup
    .string()
    .oneOf(['CUSTOMER', 'SELLER'], 'Please select a valid account role')
    .required('Account role is required'),
  city: yup
    .string()
    .trim()
    .required('City is required'),
  businessName: yup.string().when('role', {
    is: 'SELLER',
    then: (schema) =>
      schema
        .trim()
        .required('Business / Brand name is required for Sellers')
        .min(3, 'Business name must be at least 3 characters'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// 3. Auth: Forgot Password
export const forgotPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address'),
});

// 4. Become a Seller Onboarding
export const becomeSellerSchema = yup.object().shape({
  businessName: yup
    .string()
    .trim()
    .required('Business brand name is required')
    .min(3, 'Brand name must be at least 3 characters'),
  tagline: yup
    .string()
    .trim()
    .required('Tagline is required')
    .min(5, 'Tagline must be at least 5 characters (e.g. Bespoke Cakes in Lahore)'),
  category: yup
    .string()
    .trim()
    .required('Primary category is required'),
  city: yup
    .string()
    .trim()
    .required('Base city is required'),
  locality: yup
    .string()
    .trim()
    .required('Area / Locality is required')
    .min(3, 'Area must be at least 3 characters (e.g. DHA Phase 5, Gulberg)'),
  startingPrice: yup
    .number()
    .typeError('Starting price must be a valid number')
    .required('Starting price is required')
    .min(1, 'Starting price must be greater than 0'),
  description: yup
    .string()
    .trim()
    .required('Business description is required')
    .min(15, 'Please provide at least 15 characters describing your offerings and specialties'),
  experienceYears: yup
    .number()
    .typeError('Experience must be a number')
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience years cannot exceed 50'),
});

// 5. Broadcast Customer Request
export const customerRequestSchema = yup.object().shape({
  serviceNeeded: yup
    .string()
    .trim()
    .required('Service title / requirement is required')
    .min(3, 'Requirement title must be at least 3 characters (e.g. 3-Pound Birthday Cake)'),
  category: yup
    .string()
    .trim()
    .required('Category is required'),
  city: yup
    .string()
    .trim()
    .required('City is required'),
  area: yup
    .string()
    .trim()
    .required('Locality or neighborhood is required')
    .min(2, 'Area name must be at least 2 characters'),
  preferredDate: yup
    .string()
    .required('Preferred delivery / event date is required'),
  budget: yup
    .number()
    .typeError('Budget must be a valid number')
    .required('Budget is required')
    .min(300, 'Budget must be at least Rs. 300'),
  guestCountOrQuantity: yup
    .string()
    .trim()
    .required('Quantity or guest count is required (e.g. 15 guests, 2 cakes)'),
  description: yup
    .string()
    .trim()
    .required('Detailed description is required')
    .min(15, 'Please provide at least 15 characters with specific flavor, theme, or sizing details'),
  deliveryMethod: yup
    .string()
    .oneOf(['DELIVERY', 'PICKUP', 'AT_HOME'], 'Please select a valid delivery method')
    .required('Delivery method is required'),
});

// 6. Contact Us Form
export const contactSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Your full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup
    .string()
    .trim()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  subject: yup
    .string()
    .trim()
    .required('Subject is required')
    .min(3, 'Subject must be at least 3 characters'),
  message: yup
    .string()
    .trim()
    .required('Message is required')
    .min(10, 'Message must be at least 10 characters long'),
});

// 7. Add Review Modal
export const addReviewSchema = yup.object().shape({
  rating: yup
    .number()
    .typeError('Please select a star rating')
    .min(1, 'Please select at least 1 star rating')
    .max(5, 'Maximum rating is 5 stars')
    .required('Rating is required'),
  comment: yup
    .string()
    .trim()
    .required('Review comments are required')
    .min(5, 'Review must be at least 5 characters to help other community members'),
});

// 8. Booking Details Form (Step 3 in BookingPage)
export const bookingDetailsSchema = yup.object().shape({
  deliveryAddress: yup
    .string()
    .trim()
    .required('Delivery / street address is required')
    .min(6, 'Please provide a complete address with house/street details'),
  bookingDate: yup
    .string()
    .required('Date is required'),
  timeSlot: yup
    .string()
    .required('Time slot is required'),
  deliveryType: yup
    .string()
    .oneOf(['DELIVERY', 'PICKUP', 'AT_HOME'], 'Valid delivery method required')
    .required('Delivery type is required'),
});

// 9. Seller: Create Service Package
export const createServicePackageSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required('Package title is required')
    .min(3, 'Title must be at least 3 characters (e.g. 2-Pound Bento Cake)'),
  description: yup
    .string()
    .trim()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters describing portions, ingredients, or presentation'),
  price: yup
    .number()
    .typeError('Price must be a valid number')
    .required('Price is required')
    .min(1, 'Price must be greater than 0'),
  noticePeriod: yup
    .string()
    .trim()
    .required('Notice period is required (e.g. 24 hours notice)'),
});

// 10. Seller: Send Itemized Quote
export const sendQuoteSchema = yup.object().shape({
  message: yup
    .string()
    .trim()
    .required('Personalized pitch / message is required')
    .min(10, 'Message must be at least 10 characters long'),
  price: yup
    .number()
    .typeError('Price must be a valid number')
    .required('Quote price is required')
    .min(1, 'Service quote must be greater than 0'),
  deliveryFee: yup
    .number()
    .typeError('Delivery fee must be a number')
    .min(0, 'Delivery fee cannot be negative')
    .default(0),
  completionTime: yup
    .string()
    .trim()
    .required('Estimated completion time is required (e.g. 2-3 business days)'),
});

// 11. Customer: Profile Settings
export const profileSettingsSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  phone: yup
    .string()
    .trim()
    .test('phone-valid', 'Please enter a valid phone number (e.g. 03001234567 or +923001234567)', (val) => {
      if (!val) return true; // optional
      const clean = val.replace(/[\s-]/g, '');
      return /^(\+92|0)?3[0-9]{9}$/.test(clean) || clean.length >= 10;
    }),
  city: yup
    .string()
    .trim()
    .required('City is required'),
  address: yup
    .string()
    .trim()
    .test('address-len', 'Address should be at least 5 characters', (val) => {
      if (!val) return true; // optional
      return val.length >= 5;
    }),
});
