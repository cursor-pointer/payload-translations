import type { GlobalConfig } from 'payload'

export const Translations: GlobalConfig = {
  slug: 'translations',
  label: 'Translations',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Navigation',
          fields: [
            {
              name: 'home',
              type: 'text',
              label: 'Home',
              localized: true,
              required: true,
            },
            {
              name: 'events',
              type: 'text',
              label: 'Events',
              localized: true,
              required: true,
            },
            {
              name: 'posts',
              type: 'text',
              label: 'Posts',
              localized: true,
              required: true,
            },
            {
              name: 'resources',
              type: 'text',
              label: 'Resources',
              localized: true,
              required: true,
            },
          ],
        },
        {
          label: 'Search',
          fields: [
            {
              name: 'searchPlaceholder',
              type: 'text',
              label: 'Search Placeholder',
              localized: true,
              required: true,
            },
            {
              name: 'searchButton',
              type: 'text',
              label: 'Search Button',
              localized: true,
              required: true,
            },
            {
              name: 'noResults',
              type: 'text',
              label: 'No Results',
              localized: true,
              required: true,
            },
          ],
        },
        {
          label: 'Common',
          fields: [
            {
              name: 'readMore',
              type: 'text',
              label: 'Read More',
              localized: true,
              required: true,
            },
            {
              name: 'viewAll',
              type: 'text',
              label: 'View All',
              localized: true,
              required: true,
            },
            {
              name: 'loading',
              type: 'text',
              label: 'Loading',
              localized: true,
              required: true,
            },
            {
              name: 'previous',
              type: 'text',
              label: 'Previous',
              localized: true,
              required: true,
            },
            {
              name: 'next',
              type: 'text',
              label: 'Next',
              localized: true,
              required: true,
            },
          ],
        },
        {
          label: 'Forms',
          fields: [
            {
              name: 'submit',
              type: 'text',
              label: 'Submit',
              localized: true,
              required: true,
            },
            {
              name: 'required',
              type: 'text',
              label: 'Required Field',
              localized: true,
              required: true,
            },
            {
              name: 'invalidEmail',
              type: 'text',
              label: 'Invalid Email',
              localized: true,
              required: true,
            },
          ],
        },
        {
          label: 'Events',
          fields: [
            {
              name: 'upcomingEvents',
              type: 'text',
              label: 'Upcoming Events',
              localized: true,
              required: true,
            },
            {
              name: 'pastEvents',
              type: 'text',
              label: 'Past Events',
              localized: true,
              required: true,
            },
            {
              name: 'eventDate',
              type: 'text',
              label: 'Event Date',
              localized: true,
              required: true,
            },
            {
              name: 'location',
              type: 'text',
              label: 'Location',
              localized: true,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
