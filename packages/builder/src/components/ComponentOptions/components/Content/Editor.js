import React from 'react'
import { Control } from 'react-redux-form'
import { CardBody } from 'reactstrap'

import Form from '../RRFForm'
import Card from '../../../Card'
import Editor from '../../../Editor'

export default ({ id, data }) =>
  // Chrome requires explicit height settings
  // throughout, which in turn necessitates
  // manually wrapping the content in a <CardBody>
  // as well as the h-100 classes at every level
  // TODO: The layout here should be revisited
  // periodically to check whether the chrome bug
  // has been addressed
  <Card title="Content"
    className="flex-grow-1"
    wrapContent={ false }
  >
    {/* Holy multiply nested flexbox Batman! */}
    <CardBody className="h-100 d-flex flex-column">
      <Form
        id={ id }
        data={ data }
        keys={ ['content'] }
        className="flex-grow-1 d-flex flex-column"
      >
        <Control.textarea
          model=".content"
          component={ Editor }
          controlProps={{
            language: 'html',
          }}
          debounce={ 300 }
        />
      </Form>
    </CardBody>
  </Card>
