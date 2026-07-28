/* JSX substitute.
   A browser will not parse JSX inside an ES module, and this lab has no build
   step, so markup is written as tagged template literals bound to
   React.createElement:

     html`<div className=${cls}>${children}</div>`
     html`<${Panel} title="Steps" />`          // a component is interpolated
     html`<${Panel} ...${props} />`            // spread

   Everything else reads like JSX. Note that props keep their React names —
   className, onClick — because htm does no translation of its own. */

import React from 'react';
import htm from 'htm';

export const html = htm.bind(React.createElement);
export default html;
