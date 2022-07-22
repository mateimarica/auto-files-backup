Running this app on Linux:

1. Install `screen` if not installed:
    ```console
    sudo apt update
    sudo apt install screen
    ```

2. Create a copy of `template.env` named `.env`

3. Open `.env` and fill in your [files.mateimarica.dev](https://files.mateimarica.dev) credentials.


3. Install packages and run the app:
    ```console
    npm i
    npm run prod <relativeSrcDir> <intervalInHours>
    ```
    
    `relativeSrcDir` is the relative path of the directory you wish to be backed-up. Eg: `../world`
    
    `intervalInHours` is how often the backup occurs.
