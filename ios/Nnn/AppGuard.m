#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
@import LocalAuthentication;

@interface AppGuard : NSObject <RCTBridgeModule>
@property (nonatomic, strong) UIWindow *coverWindow;
@property (nonatomic, assign) BOOL secure;
@end

@implementation AppGuard

RCT_EXPORT_MODULE();

- (instancetype)init {
  if (self = [super init]) {
    NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
    [center addObserver:self selector:@selector(onResign) name:UIApplicationWillResignActiveNotification object:nil];
    [center addObserver:self selector:@selector(onActive) name:UIApplicationDidBecomeActiveNotification object:nil];
  }
  return self;
}

- (void)dealloc {
  [NSNotificationCenter.defaultCenter removeObserver:self];
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(hasFingerprint:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  LAContext *context = [LAContext new];
  NSError *error = nil;
  [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
  BOOL touch = NO;
  if (@available(iOS 11.0, *)) {
    touch = context.biometryType == LABiometryTypeTouchID;
  }
  resolve(@(touch));
}

RCT_EXPORT_METHOD(authenticate:(NSString *)title
                  cancel:(NSString *)cancel
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  LAContext *context = [LAContext new];
  context.localizedCancelTitle = cancel;
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
          localizedReason:title
                    reply:^(BOOL success, NSError *error) {
                      resolve(@(success));
                    }];
}

RCT_EXPORT_METHOD(setSecure:(BOOL)enabled) {
  self.secure = enabled;
  if (!enabled) {
    [self hideCover];
  }
}

- (UIWindow *)keyWindow {
  UIWindow *window = nil;
  if (@available(iOS 13.0, *)) {
    for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
      if (![scene isKindOfClass:[UIWindowScene class]]) {
        continue;
      }
      for (UIWindow *candidate in ((UIWindowScene *)scene).windows) {
        if (candidate.isKeyWindow) {
          window = candidate;
        }
      }
    }
  }
  if (!window) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    window = UIApplication.sharedApplication.keyWindow;
#pragma clang diagnostic pop
  }
  return window;
}

- (void)onResign {
  if (!self.secure) {
    return;
  }
  UIWindow *host = [self keyWindow];
  if (!host) {
    return;
  }
  if (!self.coverWindow) {
    self.coverWindow = [[UIWindow alloc] initWithFrame:host.bounds];
    self.coverWindow.backgroundColor = UIColor.blackColor;
    self.coverWindow.windowLevel = UIWindowLevelAlert + 1;
    if (@available(iOS 13.0, *)) {
      self.coverWindow.windowScene = host.windowScene;
    }
  }
  self.coverWindow.hidden = NO;
}

- (void)onActive {
  [self hideCover];
}

- (void)hideCover {
  self.coverWindow.hidden = YES;
}

@end
