import { forwardRef } from 'react';
import { Field } from 'formik';
import { TextField } from 'formik-mui';

const phoneInput = (props, ref) => {
  return (
    <Field
      {...props}
      component={TextField}
      inputRef={ref}
      fullWidth
      label='Phone Number'
      variant='outlined'
    />
  );
};

export default forwardRef(phoneInput);
