package org.exstagium.hasheger.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import kotlinx.coroutines.delay
import org.exstagium.hasheger.navigation.Screen
import org.exstagium.hasheger.ui.theme.HashegerTheme
import org.exstagium.hasheger.utils.AuthUtil
import org.exstagium.hasheger.utils.User

@Composable
fun SplashScreen(navController: NavController, currentUser: User?) {
    val alphaAnim = remember { Animatable(0f) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        alphaAnim.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 800)
        )
        delay(1300)
        navController.navigate(if (AuthUtil.isLoggedIn(context)) Screen.MasterKeyValidation.route else Screen.Login.route) {
            popUpTo(Screen.Splash.route) { inclusive = true }
        }
    }

    Surface {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Image(
                    imageVector = Icons.Default.Security,
                    contentDescription = "App Logo",
                    colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(androidx.compose.ui.graphics.Color.Green),

                    modifier = Modifier
                        .size(120.dp)
                        .alpha(alphaAnim.value)
                )
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = "Hasheger",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.alpha(alphaAnim.value)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Zero-Knowledge Password Manager",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.alpha(alphaAnim.value)
                )
            }
        }
    }
}

@Preview
@Composable
private fun SplashScreenPreview() {
    HashegerTheme {
        SplashScreen(navController = NavController(LocalContext.current), currentUser = null)
    }
}