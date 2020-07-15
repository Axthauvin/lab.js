Canvas-based displays
=====================

.. module:: lab

.. _reference/canvas:

The ``canvas`` is an alternate method of displaying content and stimuli on the
screen. The underlying principle are true to the canvas metaphor: A canvas is
a (rectangular) area on which lines, shapes and text can be drawn, to be shown
to the user. It is represented in ``HTML`` using the ``<canvas>`` tag.

As `Mark Pilgrim  <http://diveintohtml5.info/canvas.html>`_ has put it: "A
canvas is a rectangle in your page where you can use JavaScript to draw anything
you want."


.. contents:: Contents
  :local:

----

Introduction to the canvas
--------------------------

Why use a canvas?
^^^^^^^^^^^^^^^^^

You might be wondering: ``HTML`` largely deals with showing rectangles and text
on screen, so if a canvas basically does the same thing, why, then, is it
useful? The primary reason is that browsers are often doing more work for us
than is directly visible. In particular, for any ``HTML`` content, it is the
browser's responsibility to  maintain the layout of the page. Whenever a page's
content changes, browsers need to recalculate the layout, to make sure that any
newly inserted text pushes the content below further downward, that all text is
wrapped neatly around newly inserted images, and that all style rules are
applied. You might imagine this process like continuously trying to layout a
newspaper's front page while new content is added and deleted simultaneously.
Naturally, this process takes time, and if we rely on the browser to react very
quickly and update the display rapidly in response to our changing the content,
the resulting delay might be too long, resulting in lag.

A ``canvas`` does away with continuous layout recalculation, and instead
provides us with space on which we can happily paint and collage the content
ourselves. The browser no longer assumes responsibility for our layout, but
leaves us to squiggle at our hearts' content. If things overlap, no worries --
the browser can always paint on top! This simplifies things immensely for the
browser, but it requires a bit more thought from our side: We can no longer, for
example, ask the browser to kindly center content for us; instead, we need to
calculate its position and place it ourselves.

Canvas graphics are *raster-based*, that is, the browser remembers the color of
each pixel across the canvas, rather than the shapes and text that the colored
pixels represent. This means that a canvas cannot change its size easily; if it
does, the pixels will be warped, resulting in a blurry display. To achieve crisp
images, it is our responsibility to redraw content at different sizes depending
on the screen resolution. This sets it apart from *vector graphics*, which
represent a display through the shapes visible on it, and can be redrawn at
different sizes and resolutions without loss in quality. That being said, we
can make sure that we draw content at the appropriate resolution, and adjust
sizes depending on the client's screen to achieve crisp rendering everywhere.
As you will see, the :js:class:`canvas.Screen` component contains a few helpers
to make this easy.

Resources for learning
^^^^^^^^^^^^^^^^^^^^^^

It would be impossible to cover the usage of the canvas in detail here, but
luckily there are excellent resources available from more knowledgable authors.
We have compiled a few in the following:

* `Mozilla Developer Network: Canvas Tutorial`_ -- excellent introduction to
  the canvas, available in multiple languages
* `Mozilla Developer Network: Canvas API`_ -- A comprehensive overview of the
  canvas API

.. _Mozilla Developer Network\: Canvas Tutorial: https://developer.mozilla.org/docs/Web/Guide/HTML/Canvas_Tutorial
.. _Mozilla Developer Network\: Canvas API: https://developer.mozilla.org/docs/Web/HTML/Canvas

----

.. _reference/canvas/screen:

Screen
------

.. caution::
  The :js:class:`canvas.Screen` API, while completely functional, is not
  entirely settled yet. You are absolutely invited to use it, however please
  bear in mind that some details might change over time, as everybody gathers
  experience using it.

  In particular, the part that is most likely to change is the handling of
  animation. This is because this is the aspect of the canvas which the authors
  have the least experience with. If you are using a ``canvas`` to show animated
  content within an experiment, and would be willing to share thoughts or even
  code, please be warmly invited to drop us a line.

.. js:class:: canvas.Screen([options])

  A :js:class:`canvas.Screen` is a component in an experiment that provides a
  canvas element to draw on via Javascript. It automatically inserts a canvas
  into the page when it is run, and adjusts its size to cover the containing
  element.

  When a :js:class:`canvas.Screen` is constructed, it takes options as any
  other component. It expects either a :js:attr:`renderFunction
  <options.renderFunction>` , which is a function responsible for filling the
  canvas, or an array of shapes as :js:attr:`content <options.content>`, which
  is rendered automatically using a generic render function.

  :param object options: Options

  .. js:attribute:: options.renderFunction

    The render function contains any code that draws on the canvas when the
    screen is shown. It is called with four arguments:

    * The ``timestamp`` contains a *timestamp* which represents the point in
      time at which the function is called. It represents the interval since
      page load, measured in milliseconds.
    * The second argument, ``canvas``, contains a reference to the *Canvas
      object* provided by the :js:class:`canvas.Screen`.
    * On third place, the ``ctx`` argument provides a canvas *drawing context*.
      This is used to actually place information on the canvas.
    * Finally, the ``obj`` argument provides a reference to the
      :js:class:`canvas.Screen` that is currently drawing the canvas.

    The simplest possible :js:class:`canvas.Screen` might therefore be defined
    as follows::

      // Define a simple render function
      const renderFunction = function(ts, canvas, ctx, obj) {
        // The render function draws a simple text on the screen
        ctx.fillText(
          'Hello world', // Text to be shown
          canvas.width / 2, // x coordinate
          canvas.height / 2 // y coordinate
        )
      }

      // Define a canvas.Screen that uses the render function
      const example_screen = new lab.canvas.Screen({
        renderFunction: renderFunction,
      })

      // Run the component
      example_screen.run()

  .. js:attribute:: options.ctxType

    Drawing mode: String, defaults to ``'2d'``

    Type of canvas context passed to the render function (via the ``ctx``
    parameter, as described above). By default, the context will be of the
    ``2d`` variety, which will probably be most commonly used in experiments.
    However, `more types are possible
    <https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/getContext>`_,
    in particular if the content is three-dimensional or drawn using 3d hardware
    acceleration. [#f1]_

  .. js:attribute:: options.translateOrigin

    Shift the origin of the coordinate system to the center of the visible
    canvas. Boolean, defaults to ``true``

    In conjunction with the :js:attr:`viewport <options.viewport>`, this option
    helps in creating a coordinate system that is replicable across screen
    sizes.

  .. js:attribute:: options.viewport

    Size of canvas content: Array, defaults to ``[800, 600]``

    Specifies the dimensions of the central canvas content (as tuple of width
    and height in pixels). In conjunction with :js:attr:`viewportScale
    <options.viewportScale>`, this can be used to design a screen at a specific
    size and then, during the study, automatically scale this area to fit
    participants' screen dimensions.

  .. js:attribute:: options.viewportScale

    Scale :js:attr:`viewport <options.viewport>` to fit screen: ``'auto'``
    (default), or numeric scale factor.

    If set to ``'auto'``, translates canvas coordinate system so that the
    visible area covered by the canvas is assigned a (virtual) width and height
    corresponding to the :js:attr:`viewport <options.viewport>` size. The
    aspect ratio is perserved, so that the entirety of the viewport is always
    shown (empty space may be added at the top and bottom or at the sides,
    depending on the available space).

    For any numeric value, the coordinate system is scaled so that *n* pixels
    on the canvas correspond to *n * viewportScale* browser pixel units.

  .. js:attribute:: options.viewportEdge

    Draw viewport borders: Boolean, defaults to ``false``

  .. js:attribute:: options.devicePixelScaling

    Use native rendering resolution for high-DPI (retina) displays: Boolean,
    defaults to ``true``

----

Examples and tricks
^^^^^^^^^^^^^^^^^^^

Drawing shapes
""""""""""""""

The most natural use of the canvas is to draw shapes on it. In comparison to
using ``HTML`` and images, this approach will offer you greater flexibility and
likely slightly better timing properties: As noted above, a canvas will provide
faster drawing times since it does not need to load images and layout the page.
This is particularly important if you are drawing different shapes in rapid
succession.

A simple example, which shows a square, a circle and a triangle on screen,
might be realized as follows::

  const renderFunction = function(ts, canvas, ctx, obj) {
    // Draw a *square* ------------------------------------
    // (let's start easy!)
    ctx.fillStyle = '#164f86'
    ctx.fillRect(
      canvas.width * 0.2 - 25,  // x coordinate
      canvas.height * 0.5 - 25, // y coordinate
      50, // width
      50  // height
    )

    // Draw a *circle* ------------------------------------
    // Start a new path
    ctx.beginPath()
    ctx.arc(
      canvas.width * 0.4,  // x center
      canvas.height * 0.5, // y center
      27.5,                // radius
      0,                   // start angle
      2 * Math.PI          // end angle (in radians)
    )
    // Fill the newly defined shape
    ctx.fillStyle = '#861001'
    ctx.fill()

    // Draw a *triangle* ----------------------------------
    // (this is slightly more involved, as we
    // need to draw all the edges manually)
    let center_x = canvas.width * 0.6
    let center_y = canvas.height * 0.5 + 8 // (moved downward slightly)
    let r = 32 // radius

    ctx.beginPath()

    // Move to the apex
    ctx.moveTo(
      center_x + r * Math.cos((0/3 - 0.5) * Math.PI), // center + displacement
      center_y + r * Math.sin((0/3 - 0.5) * Math.PI)
    )
    // First edge
    ctx.lineTo(
      center_x + r * Math.cos((2/3 - 0.5) * Math.PI),
      center_y + r * Math.sin((2/3 - 0.5) * Math.PI)
    )
    // Second edge
    ctx.lineTo(
      center_x + r * Math.cos((4/3 - 0.5) * Math.PI),
      center_y + r * Math.sin((4/3 - 0.5) * Math.PI)
    )
    // Fill the shape
    ctx.fillStyle = '#bd5b0c'
    ctx.fill()

    // Draw a *polygon* -----------------------------------
    // (this uses the same principles as the
    // triangle above, but generalized and
    // written as a loop)
    center_x = canvas.width * 0.8
    center_y = canvas.height * 0.5
    r = 30
    let edges = 5

    ctx.beginPath()

    // Draw the edges sequentially
    for (let i = 0; i <= edges; i += 1) {
      // Use trigonometry to calculate
      // the position of each vertex
      let x = center_x + r * Math.cos(i * 2 * Math.PI / edges - 0.5 * Math.PI)
      let y = center_y + r * Math.sin(i * 2 * Math.PI / edges - 0.5 * Math.PI)

      if (i === 0) {
        // For the first point, merely move the drawing cursor
        ctx.moveTo(x, y)
      } else {
        // Draw a line to each subsequent vertex
        ctx.lineTo(x, y)
      }
    }

    // Fill the shape spanned by the vertices
    ctx.fillStyle = '#0b5d18'
    ctx.fill()
  }

Sharp lines
"""""""""""

When you draw lines on a canvas, you might notice that vertical and horizontal
lines are not as sharp as you might have expected, namely if these lines have
integer coordinates in both dimensions (or, to be exact, in that dimension in
which the line does not extend).

The reason for this behavior is that the canvas coordinate system does not place
points into the center of pixels, but rather at their edge. This means that any
given point with integer coordinates is placed at the point at which the four
surrounding pixels meet. Therefore, a vertical or horizontal line with integer
coordinates in one dimension will always follow the edge between two adjacent
pixels, and the browser will attempt to do this situation justice by drawing a
slightly coloring both of the pixels in a slightly lighter shade than the line
would otherwise have been.

To achieve crisp rendering and draw lines along the coordinate system (for lines
where the width is an odd integer number), you'll need offset the coordinates by
half a pixel. You could shift the `x` and `y` coordinates of each drawing
command by 0.5, or alternatively you might apply a global shift using
``ctx.translate(0.5, 0.5)``.

Advanced text placement
"""""""""""""""""""""""

If you run the example above, you will notice that the text is not actually
centered, but rather placed to right of the center of the screen, and slightly
above the vertical center. This is is because, by default, the coordinates
define the leftmost point at the baseline of the text (the baseline is
the bottom of letters without descenders, such as all letters in this set of
brackets)
This placement is not typically the most helpful when putting together a screen.
Instead, it is often easier to define the (vertical and horizontal) center of a
given text. A 'corrected' render function might look as follows::

  const renderFunction = function(ts, canvas, ctx, obj) {
    // Set a font size and family
    ctx.font = '40px Helvetica,Arial,sans-serif'

    // Center the text horizontally
    // around the specified coordinates
    ctx.textAlign = 'center'
    // Center the text vertically
    // around the center of lowercase letters
    ctx.textBaseline = 'middle'

    // Draw the text as before
    ctx.fillText(
      'Hello world',
      canvas.width / 2, // x
      canvas.height / 2 // y
    )
  }

Saving and resetting drawing options
""""""""""""""""""""""""""""""""""""

In the last example, the code set several options for drawing on the canvas,
such as the font size and type, and the positioning of text. The above code
changes these attributes for the entire context, meaning that any later calls
of the ``fillText`` method use the same alignment and font, until the respective
options are changed.
This behavior, however, is often not desirable. Often, options are used only
once, and should be reverted to a sensible default after their application. This
is possible through the ``ctx.save()`` and ``.restore()`` methods provided by a
2d drawing context. Invoking these methods saves the state of the current
settings to an internal stack, to be restored at any later point.

Again extending the above render function, this might be used as follows::

  const renderFunction = function(ts, canvas, ctx, obj) {
    // Set a font size and family as default
    ctx.font = '24px Helvetica,Arial,sans-serif'

    // Center the text horizontally and vertically
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Save the context state
    ctx.save()

    // Draw some larger text
    ctx.font = '36px Helvetica,Arial,sans-serif'
    ctx.fillText(
      'Welcome!',
      canvas.width / 2, // x
      canvas.height * 0.4 // y
    )

    // Restore the previous state
    ctx.restore()

    // Draw text using the initially defined size
    ctx.fillText(
      'Thank you for participating in this experiment',
      canvas.width / 2,
      canvas.height * 0.6
    )
  }


Using external libraries for drawing
""""""""""""""""""""""""""""""""""""

If you find yourself building very complex interactive graphics using a canvas,
consider enlisting a helper library to simplify drawing, such as `three.js
<http://threejs.org/>`_ .

----

.. [#f1] If you ever do this, please let us know, we will award you the coveted
  *lab.js brave soul award*.
