package org.exstagium.hasheger.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import org.exstagium.hasheger.utils.BiometricUtils

@Composable
fun BiometricAuthScreen(
    biometricUtils: BiometricUtils,
    onAuthenticated: () -> Unit,
    onFailed: () -> Unit = {}
) {
    var message by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = message)

        Spacer(modifier = Modifier.height(20.dp))

        Button(onClick = {
            if (biometricUtils.canAuthenticate()) {
                biometricUtils.showBiometricPrompt(
                    onAuthSuccess = {
                        message = "Authentication Success!"
                        onAuthenticated()
                    },
                    onAuthError = { err ->
                        println("Error in auth: $err")
                        message = "Error: $err"
                        onFailed()
                    }
                )
            } else {
                message = "Biometric not available on this device"
            }
        }) {
            Text("Authenticate with Biometrics")
        }
    }
}
