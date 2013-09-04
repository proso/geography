# -*- coding: utf-8 -*-

from core.models import Place, Student, UsersPlace, PlaceRelation
from core.utils import QuestionService, JsonResponse
from django.conf import settings
from django.contrib.auth.models import User
from django.core.context_processors import csrf
from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.shortcuts import render_to_response
from django.utils import simplejson
from lazysignup.decorators import allow_lazy_user



# Create your views here.
def home(request):
    request.META["CSRF_COOKIE_USED"] = True
    title = 'Loc - ' if not settings.ON_OPENSHIFT else ''
    c = {
         'title' : title,
         'isProduction' : settings.ON_OPENSHIFT,
    }
    c.update(csrf(request))
    return render_to_response('home/home.html', c)

def users_places(request, map_code, user=''):
    try:
        map = PlaceRelation.objects.get(place__code=map_code, type=PlaceRelation.IS_ON_MAP)
    except PlaceRelation.DoesNotExist:
        raise Http404("Unknown map name: {0}".format(map_code))
    if (user == ''):
        user = request.user
    else:
        try:
            user = User.objects.get(username=user)
        except User.DoesNotExist:
            raise HttpResponseBadRequest("Invalid username: {0}" % user)
        
    if request.user.is_authenticated():
        student = Student.objects.fromUser(user)
        ps = UsersPlace.objects.filter(
           user=student,
           place_id__in=map.related_places.all()
       )
    else:
        ps =[]
    try:
        cs = PlaceRelation.objects.get(place__code=map_code, type=PlaceRelation.IS_SUBMAP).related_places.all()
    except PlaceRelation.DoesNotExist:
        cs = []
    response = [{
        'name': u'Státy',
        'places': [p.to_serializable() for p in ps]
    },{
        'name': u'Kontinenty',
        'haveMaps': True,
        'places': [p.to_serializable() for p in cs]
    }]
    return JsonResponse(response)

@allow_lazy_user
def question(request, map_code):
    try:
        map = PlaceRelation.objects.get(place__code=map_code, type=PlaceRelation.IS_ON_MAP)
    except PlaceRelation.DoesNotExist:
        raise Http404
    qs = QuestionService(user=request.user, map=map)
    questionIndex = 0
    if (request.raw_post_data != ""):
        answer = simplejson.loads(request.raw_post_data)
        questionIndex = answer['index'] + 1
        qs.answer(answer);
    noOfQuestions = 5 if Student.objects.fromUser(request.user).points < 10 else 10
    noOfQuestions -= questionIndex
    response = qs.get_questions(noOfQuestions)
    return JsonResponse(response)

