const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const { Client } = require('ssh2');

(() => {
  const $connect = document.querySelector('#js-connect');
  const $connectHost = $connect.querySelector('input[name=host]');
  const $connectPort = $connect.querySelector('input[name=port]');
  const $connectUsername = $connect.querySelector('input[name=username]');
  const $connectPassword = $connect.querySelector('input[name=password]');
  const $connectPrivateKeyPath = $connect.querySelector('input[name=privateKeyPath]');
  const $connectBtn = $connect.querySelector('#js-connectBtn');

  const $fetch = document.querySelector('#js-fetch');
  const $fetchPath = $fetch.querySelector('input[name=path]');
  const $fetchBtn = $fetch.querySelector('#js-fetchBtn');

  const $list = document.querySelector('#js-list');
  const $resultList = $list.querySelector('#js-resultList');
  const $downloadPath = $list.querySelector('input[name=downloadPath]');
  const $downloadBtn = $list.querySelector('#js-downloadBtn');



  $downloadPath.value = os.userInfo().homedir + '/Downloads';

  const storageSettings = localStorage.getItem('settings') || {};
  const settings = JSON.parse(storageSettings);
  if (settings.host) {
    $connectHost.value = settings.host;
  }
  if (settings.port) {
    $connectPort.value = settings.port;
  }
  if (settings.username) {
    $connectUsername.value = settings.username;
  }
  if (settings.password) {
    $connectPassword.value = settings.password;
  }
  if (settings.privateKeyPath) {
    $connectPrivateKeyPath.value = settings.privateKeyPath;
  }

  if (settings.downloadPath) {
    $downloadPath.value = settings.downloadPath;
  }



  const conn = new Client();

  $connectBtn.addEventListener('click', () => {
    console.log('connection start!');

    const config = {
      host: $connectHost.value,
      port: $connectPort.value,
      username: $connectUsername.value,
    };

    if ($connectPrivateKeyPath.value) {
      config.privateKey = fs.readFileSync($connectPrivateKeyPath.value);
    } else if ($connectPassword.value) {
      config.password = $connectPassword.value;
    }

    conn.on('ready', () => {
      console.log('ssh ready.');

      $fetch.classList.remove('hide');
      $list.classList.remove('hide');

      settings.host = $connectHost.value;
      settings.port = $connectPort.value;
      settings.username = $connectUsername.value;
      settings.password = $connectPassword.value;
      settings.privateKeyPath = $connectPrivateKeyPath.value;
      localStorage.setItem('settings', JSON.stringify(settings));
    }).connect(config);
  });







  $fetchBtn.addEventListener('click', () => {
    const path = $fetchPath.value;
    console.log('ls', path);

    $resultList.innerHTML = '';

    conn.shell(false, { pty: false }, (err, stream) => {
      if (err) {
        console.log('Error:', err);
        alert(`Error: ${err}`);
        return;
      }

      stream.on('data', (data) => {
        const response = data.toString();
        if (!response) {
          return;
        }

        _.each(response.split('\n'), (filename) => {
          if (!filename || filename.length > 30) {
            return;
          }

          const $li = document.createElement('li');
          const $label = document.createElement('label');
          const $checkbox = document.createElement('input');
          const $text = document.createElement('span');

          $label.classList.add('checkbox');
          $checkbox.type = 'checkbox';
          $checkbox.value = filename;
          $text.innerText = filename;

          $li.appendChild($label);
          if (filename.indexOf('/') === -1) {
            $label.appendChild($checkbox);
          } else {
            $label.addEventListener('click', () => {
              $resultList.innerHTML = '';
              $fetchPath.value = $fetchPath.value + $checkbox.value;
              stream.write(`ls -F ${$fetchPath.value}\n`);
            });
          }
          $label.appendChild($text);
          $resultList.appendChild($li);
        });
      });

      stream.write(`ls -F ${path}\n`);
    });
  });

  $downloadBtn.addEventListener('click', () => {
    console.log('start download.');

    conn.sftp((err, sftp) => {
      if (err) {
        console.log('Error:', err);
        alert(`Error: ${err}`);
        return;
      }

      _.each($resultList.querySelectorAll('input:checked'), ($el) => {
        const remotePath = `${$fetchPath.value}/${$el.value}`;
        const localPath = `${$downloadPath.value}/${$el.value}`;

        console.log('download:', remotePath);
        sftp.fastGet(remotePath, localPath, {}, (err) => {
          if (err) {
            console.log('Error:', err);
            alert(`Error: ${err}`);
            return;
          }

          console.log('downloaded:', remotePath);
        });
      });

      settings.downloadPath = $downloadPath.value;
      localStorage.setItem('settings', JSON.stringify(settings));
    });
  });
})();
