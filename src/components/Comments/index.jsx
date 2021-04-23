/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
// eslint-disable-next-line no-use-before-define
import React, { Component } from 'react';

export default class Comments extends Component {
  componentDidMount() {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', true);
    script.setAttribute('repo', 'RochaLS/ignite-blog');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'Comment');
    script.setAttribute('theme', 'photon-dark');
    anchor.appendChild(script);
  }

  render() {
    return <div id="inject-comments-for-uterances"></div>;
  }
}
