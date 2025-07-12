'use client'
import $ from 'jquery';

export default function initJQueryInteractions() {
  $(function () {
    $('.forgotBtn').click(function () {
      $('#forgot').toggleClass('toggle');
    });

    $('.registerBtn').click(function () {
      $('#register, #formContainer').toggleClass('toggle');
    });
  });
}
