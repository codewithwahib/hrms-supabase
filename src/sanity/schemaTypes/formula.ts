// schemas/formula.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'formula',
  title: 'Formula',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Formula Name',
      type: 'string',
    }),
    defineField({
      name: 'operation',
      title: 'Operation',
      type: 'string',
      options: {
        list: [
          {title: 'Add', value: 'add'},
          {title: 'Subtract', value: 'subtract'},
          {title: 'Multiply', value: 'multiply'},
          {title: 'Divide', value: 'divide'},
        ],
      },
    }),
  ],
})