const VERSION = "1.4"

function Component()
{
    generateTr();
    component.addDependency("QIF");
}

function generateTr() {
    component.setValue("DisplayName", qsTr("CQtDeployer " + VERSION));
    component.setValue("Description", qsTr("This package contains CQtDeployer version " + VERSION));
}


Component.prototype.createOperations = function()
{
//    // call default implementation to actually install README.txt!
    component.createOperations();
    systemIntegration();

}

function stripPath(path, separator) {
    const array =  path.split(separator);

    let newPath = [];

    array.forEach(function (item) {
        if (!newPath.includes(item)) {
            newPath.push(item);
        }
    });

    return newPath.join(separator);
}

function stripWinPath(path) {
    return stripPath(path, ';');
}

function stripUnixPath(path) {
    return stripPath(path, ':');
}

function systemIntegration() {
    targetDir = installer.value("TargetDir", "");
    homeDir = installer.value("HomeDir", "");

    console.log("install component")
    console.log("targetDir "  + targetDir)
    console.log("hometDir "  + homeDir)

    if (systemInfo.kernelType === "winnt") {
        component.addOperation('EnvironmentVariable',
                               [
                                   "cqtdeployer",
                                   "\"" + targetDir + "\\" + VERSION + "\\cqtdeployer.bat\""
                               ]
                              )

        component.addOperation('EnvironmentVariable',
                               [
                                   "cqtDir",
                                   "\"" + targetDir + "\\" + VERSION + "\\\""
                               ]
                              )

        let PATH = installer.environmentVariable("PATH");
        const cqtDir = installer.environmentVariable("cqtDir");

        console.log("path befor strip : " + PATH);

        if (!PATH.includes(cqtDir) || !cqtDir.length) {
            PATH = stripWinPath(PATH);
            console.log("path after strip : " + PATH);

            component.addOperation('Execute', ["SETX", "PATH", PATH + ";%cqtDir%"])
        }

    } else {

        if (!installer.fileExists(homeDir + "/.local/bin")) {

            component.addOperation('Execute', ["mkdir", "-p", homeDir + "/.local/bin"])

            QMessageBox["warning"](qsTr("install in system"), qsTr("Installer"),
                qsTr("The \"~/local/bin\" folder was not initialized, you may need to reboot to work correctly!"),
                                   QMessageBox.Ok);

            const ansver = installer.execute('cat', [homeDir + "/.profile"]);
            let result;
            if (ansver.length >= 2) {
                result = ansver[0];
            }

            if (!result.includes("/.local/bin")) {

                const script = '\n# set PATH so it includes users private bin if it exists (generated by cqtdeployer installer) \n' +
                                'if [ -d "$HOME/.local/bin" ] ; then \n' +
                                '    PATH="$HOME/.local/bin:$PATH" \n' +
                                'fi \n';

                component.addOperation('AppendFile', [homeDir + "/.profile", script])
            }

        }
        component.addOperation('Execute', ["ln", "-sf", targetDir + "/" + VERSION + "/cqtdeployer.sh",
                                           homeDir + "/.local/bin/cqtdeployer"],
                               "UNDOEXECUTE", ["rm", "-f", homeDir + "/.local/bin/cqtdeployer"] )

        component.addOperation('Execute', ["ln", "-sf", targetDir + "/" + VERSION + "/cqt.sh",
                                           homeDir + "/.local/bin/cqt"],
                               "UNDOEXECUTE", ["rm", "-f", homeDir + "/.local/bin/cqt"] )

        component.addOperation('Execute', ["ln", "-sf", targetDir + "/" + VERSION + "/cqt.sh",
                                           homeDir + "/.local/bin/cqtdeployer.cqt"],
                               "UNDOEXECUTE", ["rm", "-f", homeDir + "/.local/bin/cqtdeployer.cqt"] )

    }

}
