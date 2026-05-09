'use strict';

const React = require('react');

const View = ({ children, style, ...props }) => React.createElement('View', { style, ...props }, children);
const Text = ({ children, style, ...props }) => React.createElement('Text', { style, ...props }, children);
const ScrollView = ({ children, style, contentContainerStyle, ...props }) =>
  React.createElement('ScrollView', { style, contentContainerStyle, ...props }, children);
const TouchableHighlight = ({ children, onPress, style, underlayColor, ...props }) =>
  React.createElement('TouchableHighlight', { onPress, style, underlayColor, ...props }, children);

const StyleSheet = {
  create: styles => styles,
};

const AppRegistry = {
  registerComponent: jest.fn(),
};

module.exports = {
  View,
  Text,
  ScrollView,
  TouchableHighlight,
  StyleSheet,
  AppRegistry,
  Component: React.Component,
};
